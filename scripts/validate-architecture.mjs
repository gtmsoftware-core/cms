#!/usr/bin/env node
/**
 * Validação de arquitetura do CMS.
 * Uso: pnpm validate:arch  (node scripts/validate-architecture.mjs, executado na raiz do monorepo)
 *
 * Verificações:
 *   1. Ciclos e regras de camada        → dependency-cruiser (.dependency-cruiser.cjs)
 *   2. Tamanho de arquivo               → .tsx > 300 linhas = erro; .ts > 400 linhas = alerta
 *   3. Fronteira cliente/servidor       → arquivos 'use client' não importam código de servidor
 *
 * Sai com código 1 se houver qualquer erro.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/* ---------------- Configuração ---------------- */

const ROOT = process.cwd();
const CMS_SRC = 'apps/cms/src';
const TARGETS = [CMS_SRC, 'packages/sdk/src'];
const DEPCRUISE_CONFIG = '.dependency-cruiser.cjs';

const LIMITS = Object.freeze({ componentLines: 300, moduleLines: 400 });

const IGNORED_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage', 'drizzle', '__generated__']);
const SOURCE_FILE = /\.tsx?$/;
const DECLARATION_FILE = /\.d\.ts$/;
const TEST_FILE = /\.(test|spec)\.tsx?$/;
const GENERATED_FILE = /\.(gen|generated)\.tsx?$/;

const USE_CLIENT = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/;
const IMPORT_SPECIFIER =
  /(?:import|export)\s+(type\s+)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

const SERVER_PACKAGES = [/^server-only$/, /^drizzle-orm(\/|$)/, /^postgres$/, /^node:/, /^@aws-sdk\//, /^next\/headers$/];
const SERVER_DIRS = [`/${CMS_SRC}/infrastructure/`, `/${CMS_SRC}/composition/`];

/* ---------------- Utilitários ---------------- */

const errors = [];
const warnings = [];

const toPosix = (p) => p.split(path.sep).join('/');
const relative = (abs) => toPosix(path.relative(ROOT, abs));

function listSourceFiles(dir) {
  const files = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) stack.push(full);
      } else if (SOURCE_FILE.test(entry.name) && !DECLARATION_FILE.test(entry.name)) {
        files.push(full);
      }
    }
  }
  return files;
}

function countLines(content) {
  const lines = content.split(/\r?\n/);
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
}

function resolveSpecifier(fromFile, specifier) {
  const fromRel = relative(fromFile);
  if (specifier.startsWith('@/') && fromRel.startsWith(`${CMS_SRC}/`)) {
    return toPosix(path.join(ROOT, CMS_SRC, specifier.slice(2)));
  }
  if (specifier.startsWith('.')) {
    return toPosix(path.resolve(path.dirname(fromFile), specifier));
  }
  return null;
}

function* runtimeImports(content) {
  for (const match of content.matchAll(IMPORT_SPECIFIER)) {
    const isTypeOnly = Boolean(match[1]);
    const specifier = match[2] ?? match[3] ?? match[4];
    if (specifier && !isTypeOnly) yield specifier;
  }
}

/* ---------------- Verificação 1: dependency-cruiser ---------------- */

function checkDependencyRules(targets) {
  const binName = process.platform === 'win32' ? 'depcruise.cmd' : 'depcruise';
  const bin = path.join(ROOT, 'node_modules', '.bin', binName);

  if (!existsSync(bin)) {
    errors.push('dependency-cruiser não está instalado. Rode: pnpm add -Dw dependency-cruiser');
    return;
  }
  if (!existsSync(path.join(ROOT, DEPCRUISE_CONFIG))) {
    errors.push(`Arquivo ${DEPCRUISE_CONFIG} não encontrado na raiz do repositório.`);
    return;
  }

  console.log('▶ Ciclos e regras de camada (dependency-cruiser)');
  const result = spawnSync(bin, [...targets, '--config', DEPCRUISE_CONFIG, '--output-type', 'json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    errors.push(`Falha ao executar dependency-cruiser: ${result.error.message}`);
    return;
  }
  if (result.stderr.includes('missing-tsc-transpiler')) {
    errors.push('dependency-cruiser não encontrou um TypeScript compatível. Instale typescript 6 (pnpm add -Dw typescript@^6).');
  }

  let summary;
  try {
    summary = JSON.parse(result.stdout).summary;
  } catch {
    process.stderr.write(result.stderr);
    errors.push('dependency-cruiser falhou antes de analisar o código (detalhes acima).');
    return;
  }

  if (summary.totalCruised === 0) {
    errors.push('dependency-cruiser não analisou nenhum módulo. Verifique o tsconfig e os diretórios-alvo.');
    return;
  }

  for (const violation of summary.violations) {
    const target = violation.cycle
      ? violation.cycle.map((step) => step.name ?? step).join(' → ')
      : violation.to;
    const line =
      violation.from === target
        ? `[${violation.rule.name}] ${violation.from}`
        : `[${violation.rule.name}] ${violation.from} → ${target}`;
    (violation.rule.severity === 'error' ? errors : warnings).push(line);
  }
  console.log(`  ${summary.totalCruised} módulos e ${summary.totalDependenciesCruised} dependências analisados.`);
}

/* ---------------- Verificação 2: tamanho de arquivo ---------------- */

function checkFileSize(file, content) {
  const rel = relative(file);
  if (TEST_FILE.test(rel) || GENERATED_FILE.test(rel)) return;

  const lines = countLines(content);
  if (rel.endsWith('.tsx') && lines > LIMITS.componentLines) {
    errors.push(`${rel}: ${lines} linhas (limite de componente: ${LIMITS.componentLines}). Extraia subcomponentes ou hooks.`);
  } else if (rel.endsWith('.ts') && lines > LIMITS.moduleLines) {
    warnings.push(`${rel}: ${lines} linhas (alerta acima de ${LIMITS.moduleLines}). Considere dividir o módulo.`);
  }
}

/* ---------------- Verificação 3: fronteira cliente/servidor ---------------- */

function checkClientBoundary(file, content) {
  if (!USE_CLIENT.test(content)) return;
  const rel = relative(file);

  for (const specifier of runtimeImports(content)) {
    if (SERVER_PACKAGES.some((pattern) => pattern.test(specifier))) {
      errors.push(`${rel}: componente cliente importa pacote de servidor "${specifier}".`);
      continue;
    }
    const resolved = resolveSpecifier(file, specifier);
    if (resolved && SERVER_DIRS.some((dir) => `${resolved}/`.includes(dir))) {
      errors.push(`${rel}: componente cliente importa código de servidor "${specifier}".`);
    }
  }
}

/* ---------------- Execução ---------------- */

function main() {
  const targets = TARGETS.filter((t) => existsSync(path.join(ROOT, t)));
  const missing = TARGETS.filter((t) => !targets.includes(t));
  missing.forEach((t) => warnings.push(`Diretório ${t} não existe ainda; ignorado.`));

  if (targets.length === 0) {
    console.error('Nenhum diretório de código encontrado. Execute na raiz do monorepo.');
    process.exit(1);
  }

  checkDependencyRules(targets);

  console.log('▶ Tamanho de arquivos e fronteira cliente/servidor');
  let fileCount = 0;
  for (const target of targets) {
    for (const file of listSourceFiles(path.join(ROOT, target))) {
      const content = readFileSync(file, 'utf8');
      checkFileSize(file, content);
      checkClientBoundary(file, content);
      fileCount += 1;
    }
  }

  console.log(`\n${fileCount} arquivos verificados.`);
  if (warnings.length > 0) {
    console.warn(`\n⚠ ${warnings.length} alerta(s):`);
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
  if (errors.length > 0) {
    console.error(`\n✖ ${errors.length} erro(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log('\n✔ Arquitetura válida.');
}

main();
