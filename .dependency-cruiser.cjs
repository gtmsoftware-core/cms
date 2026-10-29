/**
 * Regras de arquitetura do CMS.
 * Executado por scripts/validate-architecture.mjs (pnpm validate:arch).
 *
 * Camadas em apps/cms/src:
 *   app → composition → infrastructure → application → domain
 *   presentation recebe dados e server actions por props; shared é folha.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */

const path = require('node:path');

const SRC = '^apps/cms/src';
const LAYERS = '(domain|application|infrastructure|presentation)';

// Pacotes de framework e infraestrutura proibidos nas camadas internas.
// A regex não é ancorada, então também casa com o layout do pnpm
// (node_modules/.pnpm/<pkg>@<versão>/node_modules/<pkg>/).
const FRAMEWORKS =
  'node_modules/(?:next|react|react-dom|drizzle-orm|postgres|next-auth|@aws-sdk|@auth)/';

const NPM_TYPES = ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg', 'npm-unknown'];

const TEST_FILES = '(\\.(test|spec)\\.tsx?$)|(/__tests__/)|(^apps/cms/tests/)';

module.exports = {
  forbidden: [
    /* ---------- Integridade geral ---------- */
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Ciclos de importação são proibidos. Extraia o trecho comum ou inverta a dependência com uma porta.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-unresolvable',
      severity: 'error',
      comment: 'Importação que não resolve para nenhum arquivo ou pacote.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-test-code-in-production',
      severity: 'error',
      comment: 'Código de produção não importa arquivos de teste.',
      from: { pathNot: TEST_FILES },
      to: { path: TEST_FILES },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Arquivo que ninguém importa. Remova ou conecte.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          `${SRC}/app/`,
          TEST_FILES,
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$',
          '(^|/)(next|drizzle|vitest|tailwind|postcss)\\.config\\.',
          '^packages/sdk/src/index\\.ts$',
          '^packages/sdk/src/next/index\\.ts$',
        ],
      },
      to: {},
    },

    /* ---------- domain: puro ---------- */
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'domain só importa domain e shared. Nenhum pacote npm, nenhuma outra camada.',
      from: { path: `${SRC}/domain/` },
      to: { pathNot: [`${SRC}/domain/`, `${SRC}/shared/`] },
    },

    /* ---------- application ---------- */
    {
      name: 'application-inward-only',
      severity: 'error',
      comment: 'application não conhece infrastructure, presentation, app nem composition.',
      from: { path: `${SRC}/application/` },
      to: { path: `${SRC}/(infrastructure|presentation|app|composition)/` },
    },
    {
      name: 'application-no-frameworks',
      severity: 'error',
      comment: 'application é independente de framework. Defina uma porta e implemente em infrastructure.',
      from: { path: `${SRC}/application/` },
      to: { dependencyTypes: NPM_TYPES, path: FRAMEWORKS },
    },

    /* ---------- infrastructure ---------- */
    {
      name: 'infrastructure-no-ui',
      severity: 'error',
      comment: 'infrastructure não importa presentation nem app.',
      from: { path: `${SRC}/infrastructure/` },
      to: { path: `${SRC}/(presentation|app)/` },
    },

    /* ---------- composition ---------- */
    {
      name: 'composition-no-ui',
      severity: 'error',
      comment: 'composition monta dependências; não conhece presentation nem app.',
      from: { path: `${SRC}/composition/` },
      to: { path: `${SRC}/(presentation|app)/` },
    },
    {
      name: 'composition-only-from-app',
      severity: 'error',
      comment: 'Somente app/ pode importar o composition root.',
      from: { path: `${SRC}/`, pathNot: `${SRC}/(app|composition)/` },
      to: { path: `${SRC}/composition/` },
    },

    /* ---------- presentation ---------- */
    {
      name: 'presentation-no-server',
      severity: 'error',
      comment: 'presentation não importa infrastructure, composition nem app. Server actions chegam por props.',
      from: { path: `${SRC}/presentation/` },
      to: { path: `${SRC}/(infrastructure|composition|app)/` },
    },
    {
      name: 'presentation-application-types-only',
      severity: 'error',
      comment: 'presentation só usa application via `import type`, exceto os schemas Zod (validação de formulário).',
      from: { path: `${SRC}/presentation/` },
      to: {
        path: `${SRC}/application/`,
        pathNot: `${SRC}/application/[^/]+/schemas/`,
        dependencyTypesNot: ['type-only'],
      },
    },

    /* ---------- app ---------- */
    {
      name: 'app-via-composition',
      severity: 'error',
      comment: 'app/ não acessa infrastructure diretamente; use o composition root.',
      from: { path: `${SRC}/app/` },
      to: { path: `${SRC}/infrastructure/` },
    },

    /* ---------- shared: folha ---------- */
    {
      name: 'shared-is-leaf',
      severity: 'error',
      comment: 'shared não depende de nenhuma camada.',
      from: { path: `${SRC}/shared/` },
      to: { path: `${SRC}/`, pathNot: `${SRC}/shared/` },
    },

    /* ---------- módulos: só pela API pública ---------- */
    {
      name: 'modules-via-public-index',
      severity: 'error',
      comment: 'Entre módulos da mesma camada, importe apenas o index.ts do outro módulo.',
      from: { path: `${SRC}/${LAYERS}/([^/]+)/` },
      to: {
        path: `${SRC}/$1/[^/]+/`,
        pathNot: [`${SRC}/$1/$2/`, `${SRC}/$1/[^/]+/index\\.tsx?$`],
      },
    },

    /* ---------- SDK: contrato independente ---------- */
    {
      name: 'sdk-independent-of-cms',
      severity: 'error',
      comment: 'O SDK é publicado separadamente e não pode depender do CMS.',
      from: { path: '^packages/sdk/' },
      to: { path: '^apps/' },
    },
    {
      name: 'sdk-core-no-frameworks',
      severity: 'error',
      comment: 'Só o subpath packages/sdk/src/next/ pode depender de Next.js.',
      from: { path: '^packages/sdk/src/', pathNot: '^packages/sdk/src/next/' },
      to: { dependencyTypes: NPM_TYPES, path: FRAMEWORKS },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(\\.next|dist|coverage|drizzle)/' },
    tsPreCompilationDeps: true,
    // Caminho absoluto: com caminho relativo, o TypeScript 6 não encontra os arquivos do projeto.
    tsConfig: { fileName: path.join(__dirname, 'apps/cms/tsconfig.json') },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)' },
    },
  },
};
