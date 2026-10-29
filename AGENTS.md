# CMS multi-tenant em Next.js: guia de orientação para desenvolvimento

> Este arquivo é a fonte de verdade para qualquer pessoa ou agente de IA que trabalhe neste repositório.
> Leia inteiro antes de escrever código. Em caso de conflito entre uma instrução pontual e este guia,
> pare e pergunte antes de seguir.

---

## 0. Contexto e objetivo

Este CMS existe para gerenciar o conteúdo de sites de pequenos negócios (clínicas, estética, oficinas,
restaurantes, escritórios) criados e mantidos por um único desenvolvedor como renda complementar.

Requisitos de negócio que orientam todas as decisões:

1. **Um CMS, vários clientes, várias aplicações.** Um cliente (tenant) pode ter mais de um site.
2. **Repositórios separados.** O CMS vive aqui; cada site de cliente vive no próprio repositório
   (criado a partir de um template). A integração entre eles acontece por um contrato versionado.
3. **Atualização automática.** Toda mudança que altera o que o público vê (criar, atualizar, publicar,
   despublicar ou excluir) dispara um webhook para a aplicação, que revalida as páginas afetadas.
4. **Baixa manutenção.** O operador tem de 8 a 12 horas por semana. Prefira sempre a solução simples,
   estável e documentada à solução engenhosa. Não crie abstrações especulativas.
5. **O cliente final edita sozinho.** A interface de edição precisa ser óbvia para leigos.

---

## 1. Princípios inegociáveis

- **Sem ciclos de módulos.** Qualquer ciclo de importação quebra o build de validação.
- **Regra de dependência da Clean Architecture.** Dependências apontam sempre para dentro:
  `app → composition → infrastructure → application → domain`. O domínio não conhece nada externo.
- **Componentes com no máximo 300 linhas** (limite rígido, validado por script). Mire em até 150.
  Se passar disso, extraia subcomponentes, hooks ou funções puras.
- **Isolamento entre tenants é requisito de segurança.** Nenhuma consulta a dados de conteúdo
  pode existir sem escopo de tenant e site.
- **Validação nas bordas.** Toda entrada externa (formulários, API, webhooks, variáveis de ambiente)
  passa por um schema Zod antes de entrar no sistema.
- **`pnpm validate:arch` precisa passar antes de cada commit e no CI.**

---

## 2. Stack

Use versões estáveis atuais. Antes de usar qualquer API de cache ou revalidação do Next.js,
confira a documentação da versão instalada, porque essas APIs mudaram entre as versões 14, 15 e 16.

| Responsabilidade | Escolha | Observação |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript `strict` | Ative `noUncheckedIndexedAccess` |
| Banco | PostgreSQL (Neon ou Supabase) | JSONB para dados dos blocos |
| ORM | Drizzle ORM + drizzle-kit | Migrations versionadas em `apps/cms/drizzle/` |
| Validação | Zod | Schemas em `application/<módulo>/schemas/` |
| Autenticação | Auth.js (ou Better Auth) | Isolada atrás de uma porta; trocar não pode afetar o domínio |
| UI do admin | Tailwind CSS + shadcn/ui | Formulários com react-hook-form + Zod |
| Texto rico | Tiptap | Salve como JSON, nunca como HTML cru |
| Mídia | Armazenamento compatível com S3 (Cloudflare R2) | Prefixo por tenant e site |
| Testes | Vitest (unidade e integração) | Playwright opcional para fluxos críticos |
| Arquitetura | dependency-cruiser + `scripts/validate-architecture.mjs` | Exige TypeScript 6 para a análise; ver seção 12 |
| Monorepo | pnpm workspaces | `apps/cms` e `packages/sdk` |

---

## 3. Repositórios e como se conectam

```
┌──────────────────────────── repositório: cms ────────────────────────────┐
│  apps/cms        → painel admin + Content Delivery API + disparo de webhook│
│  packages/sdk    → @gtmsoftware-core/cms-sdk: o contrato público entre CMS e sites│
└───────────────────────────────────────────────────────────────────────────┘
                 │ publica o SDK (GitHub Packages, privado, versionado)
                 ▼
┌──────────────── repositório: site-starter (template) ────────────────────┐
│  Next.js já integrado ao SDK: client de leitura + rota /api/revalidate    │
└───────────────────────────────────────────────────────────────────────────┘
                 │ "Use this template" no GitHub
                 ▼
     site-cliente-a      site-cliente-b      site-cliente-c   (um repo por site)
```

### 3.1 O SDK é o contrato

`packages/sdk` contém tudo que o CMS e os sites precisam concordar entre si. Nada além disso pode
ser compartilhado entre os repositórios.

- Tipos dos blocos e do conteúdo publicado.
- `createCmsClient({ baseUrl, siteId, apiKey })`: client de leitura tipado da Content Delivery API.
- `tagsFor(...)`: **única** função que gera as tags de cache. O CMS usa para preencher o webhook;
  o site usa para marcar seus fetches. Como os dois lados usam a mesma função, as tags nunca divergem.
- `verifyWebhookSignature(...)`: validação HMAC do webhook.
- `@gtmsoftware-core/cms-sdk/next` (subpath separado): `createRevalidateHandler(...)`, que gera a rota de
  revalidação pronta para o site. Só este subpath pode depender de `next`.

Versionamento: SemVer. Mudança que quebra o contrato exige versão major e uma nova versão da API
(`/api/v1` → `/api/v2`), mantendo a anterior até todos os sites migrarem. Use Renovate ou Dependabot
nos repositórios dos sites para receber as atualizações do SDK.

### 3.2 Cadastro de um novo site (onboarding)

1. No admin, o operador cria o **Tenant** (cliente) e depois o **Site**.
2. O CMS gera uma **API key de leitura** e um **segredo de webhook**. Ambos aparecem **uma única vez**;
   no banco ficam o hash da API key e o segredo cifrado.
3. O admin mostra um bloco pronto para colar nas variáveis de ambiente do site (por exemplo, na Vercel):

   ```
   CMS_URL=https://cms.seudominio.com
   CMS_SITE_ID=site_xxx
   CMS_API_KEY=cms_live_xxx
   CMS_WEBHOOK_SECRET=whsec_xxx
   ```

4. O operador informa no admin a URL do webhook do site (`https://site-do-cliente.com/api/revalidate`).
5. O botão **"Testar conexão"** envia um evento `ping`. O site responde 200 se a assinatura bater.

### 3.3 Alternativa futura: um único front-end multi-tenant

Se os sites dos clientes convergirem para os mesmos layouts, um único repositório de front-end pode
servir todos os domínios (resolvendo o site pelo hostname). Isso reduz manutenção (uma atualização
em vez de N), mas limita a personalização. O CMS já suporta esse cenário sem mudanças, porque tudo é
identificado por `siteId`. **Não implemente isso agora**; apenas não tome decisões que o impeçam.

---

## 4. Arquitetura em camadas

```
 app/            Rotas, layouts, server actions, route handlers. Só faz I/O HTTP e composição.
   │
   ▼
 composition/    Composition root: instancia repositórios e adaptadores e monta os casos de uso.
   │
   ▼
 infrastructure/ Drizzle, R2, Auth, envio HTTP de webhook, criptografia. Implementa as portas.
   │
   ▼
 application/    Casos de uso, portas (interfaces), DTOs, schemas Zod. Sem framework.
   │
   ▼
 domain/         Entidades, value objects, regras de negócio, erros, interfaces de repositório. Puro.

 presentation/   Componentes React do admin. Recebe dados e server actions por props.
 shared/         Utilitários puros (Result, ids, datas). Não importa nenhuma outra camada.
```

### Regras de importação (verificadas automaticamente)

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `domain` | `domain`, `shared` | qualquer pacote npm, qualquer outra camada |
| `application` | `domain`, `shared`, `@gtmsoftware-core/cms-sdk` (núcleo), `zod` | `next`, `react`, `drizzle-orm`, `infrastructure`, `presentation`, `app`, `composition` |
| `infrastructure` | `application`, `domain`, `shared`, libs externas | `presentation`, `app` |
| `composition` | `infrastructure`, `application`, `domain`, `shared` | `presentation`, `app` |
| `presentation` | `shared`, `application` **somente** `import type` e `application/*/schemas` | `infrastructure`, `composition`, `app` |
| `app` | `composition`, `presentation`, `application` (tipos), `shared` | `infrastructure` diretamente |
| `shared` | `shared` | qualquer outra camada |

Regras adicionais:

- **Módulos se comunicam pelo `index.ts`.** Dentro de uma camada, `content/` não importa
  `sites/internals/foo.ts`; importa `sites/index.ts`. Importação profunda entre módulos é erro.
- **Server actions ficam em `app/`** (por exemplo, `app/(admin)/.../actions.ts`) e chegam aos
  componentes de `presentation/` **por props**. Isso evita que `presentation` dependa de `app`
  e elimina o ciclo `app ↔ presentation`.
- **Arquivos com `'use client'` nunca importam código de servidor** (`infrastructure`, `composition`,
  `drizzle-orm`, `node:*`). O script de validação verifica isso.

---

## 5. Estrutura de pastas

```
cms/
├─ apps/cms/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ (auth)/login/page.tsx
│  │  │  ├─ (admin)/[tenantSlug]/[siteId]/
│  │  │  │  ├─ pages/[contentId]/page.tsx
│  │  │  │  ├─ pages/[contentId]/actions.ts
│  │  │  │  ├─ settings/page.tsx
│  │  │  │  └─ webhooks/page.tsx          ← log de entregas e botão "reenviar"
│  │  │  ├─ api/v1/sites/[siteId]/...     ← Content Delivery API
│  │  │  └─ api/cron/webhooks/route.ts    ← varredura de reenvio
│  │  ├─ composition/
│  │  │  ├─ container.ts                  ← monta todos os casos de uso
│  │  │  └─ env.ts                        ← variáveis de ambiente validadas com Zod
│  │  ├─ domain/
│  │  │  ├─ tenants/  sites/  content/  media/  webhooks/  identity/
│  │  │  └─ (cada módulo: entities.ts, errors.ts, repository.ts, index.ts)
│  │  ├─ application/
│  │  │  └─ <módulo>/
│  │  │     ├─ use-cases/update-content.ts
│  │  │     ├─ ports.ts
│  │  │     ├─ schemas/update-content.schema.ts
│  │  │     ├─ dto.ts
│  │  │     └─ index.ts
│  │  ├─ infrastructure/
│  │  │  ├─ db/ (client.ts, schema/*.ts, unit-of-work.ts)
│  │  │  └─ <módulo>/ (drizzle-*-repository.ts, adaptadores)
│  │  ├─ presentation/
│  │  │  └─ <módulo>/components/*.tsx, hooks/*.ts, index.ts
│  │  └─ shared/ (result.ts, ids.ts, clock.ts)
│  ├─ tests/ (integration/, fakes/)
│  └─ drizzle/ (migrations geradas)
├─ packages/sdk/
│  └─ src/
│     ├─ index.ts
│     ├─ content-types.ts
│     ├─ client.ts
│     ├─ tags.ts
│     ├─ webhook.ts
│     └─ next/revalidate-handler.ts
├─ scripts/validate-architecture.mjs
├─ .dependency-cruiser.cjs
└─ .github/workflows/ci.yml
```

---

## 6. Modelo multi-tenant e dados

### 6.1 Entidades

| Tabela | Campos essenciais | Notas |
|---|---|---|
| `tenants` | id, name, slug, createdAt | Um cliente |
| `sites` | id, tenantId, name, primaryDomain, apiKeyHash, apiKeyPrefix, webhookUrl, webhookSecretEnc, status | Uma aplicação do cliente |
| `users` | id, email, name | |
| `memberships` | userId, tenantId, role (`owner` \| `editor`) | O operador é `superadmin` global |
| `contents` | id, tenantId, siteId, type, slug, status (`draft` \| `published`), data (JSONB), version, publishedAt, updatedAt, deletedAt | Exclusão lógica |
| `media` | id, tenantId, siteId, storageKey, mime, size, alt | |
| `outbox_events` | id, tenantId, siteId, type, payload (JSONB), createdAt, processedAt, attempts, nextAttemptAt, lastError | Ver seção 9 |
| `webhook_deliveries` | id, eventIds, siteId, status, httpStatus, durationMs, error, attemptedAt | Log visível no admin |

Índices obrigatórios: `(siteId, type, slug)` único entre registros não excluídos; `(siteId, status)`;
`outbox_events(processedAt, nextAttemptAt)`.

### 6.2 Isolamento

- Toda função de repositório que acessa dados de um site recebe um `SiteScope` como **primeiro parâmetro**:

  ```ts
  export type SiteScope = Readonly<{ tenantId: TenantId; siteId: SiteId }>;

  export interface ContentRepository {
    findById(scope: SiteScope, id: ContentId): Promise<Content | null>;
    listPublished(scope: SiteScope, type: ContentType): Promise<Content[]>;
    save(scope: SiteScope, content: Content): Promise<void>;
  }
  ```

- **Não existem** métodos sem escopo (como `findAll()`). A implementação Drizzle sempre filtra por
  `tenantId` **e** `siteId`.
- A autorização acontece no caso de uso (`assertCanEdit(actor, scope)`), nunca no componente.
- Testes obrigatórios: um usuário do tenant A não lê, edita nem exclui dados do tenant B, e uma API key
  do site X não lê conteúdo do site Y.
- Evolução opcional: Row Level Security no Postgres como segunda camada de defesa.

---

## 7. Modelo de conteúdo

**No MVP, não construa um editor genérico de schemas.** Esse é o ponto onde projetos de CMS morrem.
Os tipos de conteúdo são definidos em código, no SDK, e cada um tem um schema Zod:

- `page`: título, slug, SEO (título, descrição, imagem) e uma lista ordenada de **blocos**.
- `site-settings` (singleton): nome do negócio, logo, cores, contatos, endereço, redes sociais, horários.
- `collection-item`: itens repetíveis (serviços, depoimentos, equipe, FAQ), com campo `collection`.

Blocos iniciais: `hero`, `rich-text`, `services-list`, `gallery`, `testimonials`, `faq`, `contact`, `cta`.

Para adicionar um bloco: crie o schema no SDK, o formulário em `presentation/content/blocks/`
e o componente de renderização no `site-starter`. Cada bloco tem seu próprio arquivo de formulário,
o que mantém os componentes pequenos.

---

## 8. Content Delivery API

- Base: `/api/v1/sites/{siteId}`.
- Autenticação: `Authorization: Bearer <api key do site>`. A chave só lê conteúdo **publicado**
  daquele site. Compare o hash com comparação em tempo constante.
- Endpoints mínimos:
  - `GET /settings`
  - `GET /pages` (lista resumida) e `GET /pages/{slug}`
  - `GET /collections/{collection}`
- Respostas validadas pelo mesmo schema do SDK antes de sair.
- O CMS não faz cache agressivo das respostas; quem faz cache é o site, usando as tags de `tagsFor`.

---

## 9. Revalidação por webhook

### 9.1 Quando disparar

Dispare quando **o que o público vê** mudar:

| Ação no CMS | Evento | Dispara? |
|---|---|---|
| Salvar rascunho | — | Não (não muda o site público) |
| Publicar | `content.published` | Sim |
| Atualizar conteúdo já publicado | `content.updated` | Sim |
| Despublicar | `content.unpublished` | Sim |
| Excluir conteúdo publicado | `content.deleted` | Sim |
| Alterar configurações do site | `site.settings.updated` | Sim |
| Excluir mídia | `media.deleted` | Sim |
| Botão "Testar conexão" | `ping` | Sim |

Se o MVP não tiver rascunhos (todo salvamento é publicado), todo salvamento dispara.

### 9.2 Entrega confiável: padrão Transactional Outbox

1. O caso de uso grava a mudança **e** o evento em `outbox_events` **na mesma transação**.
   Assim, nunca existe mudança sem evento nem evento sem mudança.
2. Depois do commit, a rota agenda o despacho com `after()` do `next/server`, sem atrasar a resposta
   ao usuário.
3. O despachante agrupa os eventos pendentes **por site** (janela curta, por exemplo 2 segundos) e envia
   **uma** requisição com a união das tags. Dez salvamentos seguidos geram um webhook, não dez.
4. Falhas são reenviadas com backoff exponencial (por exemplo 30 s, 2 min, 10 min, 1 h, 6 h), até
   8 tentativas. A rota `api/cron/webhooks` faz a varredura de pendentes (Vercel Cron ou serviço externo),
   protegida por segredo.
5. Após a última tentativa, o evento fica como **falho** no log do admin, com botão **"Reenviar"**.
6. O admin também oferece **"Revalidar site inteiro"**, que envia a tag global do site.

Porta na camada de aplicação:

```ts
export interface WebhookSender {
  send(target: WebhookTarget, delivery: WebhookDelivery): Promise<WebhookResult>;
}
```

### 9.3 Contrato HTTP do webhook

```
POST {webhookUrl}
Content-Type: application/json
X-CMS-Event: content.updated
X-CMS-Delivery-Id: dlv_01J...
X-CMS-Timestamp: 1767225600
X-CMS-Signature: v1=<hex(HMAC_SHA256(secret, `${timestamp}.${rawBody}`))>
```

```json
{
  "deliveryId": "dlv_01J...",
  "siteId": "site_xxx",
  "occurredAt": "2026-10-28T14:00:00.000Z",
  "events": [
    { "type": "content.updated", "contentType": "page", "id": "cnt_123", "slug": "servicos" }
  ],
  "tags": ["cms:site", "cms:page:list", "cms:page:servicos"]
}
```

Regras de segurança:

- O site rejeita timestamps com mais de 5 minutos de diferença (proteção contra replay).
- A comparação da assinatura usa `crypto.timingSafeEqual`.
- A assinatura é calculada sobre o **corpo bruto**, nunca sobre o JSON re-serializado.
- O segredo de webhook é diferente da API key e pode ser rotacionado no admin.

### 9.4 Convenção de tags (em `packages/sdk/src/tags.ts`)

```ts
export const CMS_TAGS = {
  site: () => 'cms:site',
  settings: () => 'cms:settings',
  pageList: () => 'cms:page:list',
  page: (slug: string) => `cms:page:${slug}`,
  collection: (name: string) => `cms:collection:${name}`,
} as const;
```

Não inclua `siteId` nas tags: cada site tem o próprio cache. Se um dia existir um front-end
multi-tenant (seção 3.3), adicione o prefixo do site em uma versão major do SDK.

### 9.5 Lado da aplicação (já incluído no `site-starter`)

```ts
// app/api/revalidate/route.ts
import { createRevalidateHandler } from '@gtmsoftware-core/cms-sdk/next';

export const POST = createRevalidateHandler({
  secret: process.env.CMS_WEBHOOK_SECRET!,
});
```

Dentro do handler do SDK:

1. Lê o corpo bruto, valida assinatura e timestamp e responde 401 se falhar.
2. Valida o payload com Zod e responde 400 se for inválido.
3. Chama `revalidateTag(tag, 'max')` para cada tag. Em route handlers do Next.js 16,
   `revalidateTag` exige o segundo argumento e usa stale-while-revalidate: **o primeiro acesso depois
   da mudança ainda pode ver a versão antiga**, e os seguintes já veem a nova. Se o cliente exigir
   atualização imediata, confira na documentação da versão instalada a opção de expiração imediata.
   `updateTag` **não funciona** em route handlers; ele é exclusivo de server actions.
4. Responde 200 rapidamente. O CMS considera sucesso qualquer 2xx.

Leitura no site, sempre com as tags do SDK:

```ts
const page = await cms.getPage('servicos'); // o client aplica as tags corretas internamente
```

No próprio painel admin do CMS, as server actions usam `updateTag` para que o editor veja a própria
alteração imediatamente (read-your-own-writes).

---

## 10. Segurança

- Variáveis de ambiente validadas com Zod em `composition/env.ts`; a aplicação não sobe se faltar alguma.
- Segredos de webhook cifrados no banco (AES-256-GCM com chave em variável de ambiente).
- API keys: somente o hash (SHA-256) e um prefixo legível ficam no banco.
- Uploads: valide tipo MIME e tamanho no servidor; nunca confie na extensão do arquivo.
- Texto rico renderizado a partir de JSON (Tiptap), nunca com `dangerouslySetInnerHTML` de entrada do usuário.
- Rate limit na Content Delivery API e na rota de login.
- Logs nunca contêm segredos, API keys completas ou corpo de requisições com dados pessoais.

---

## 11. Regras de código e legibilidade

- **Componentes `.tsx`: máximo de 300 linhas** (erro). Mire em 150.
- **Módulos `.ts`: alerta acima de 400 linhas.**
- Funções com uma responsabilidade; se precisar de um comentário para explicar o que um bloco faz,
  extraia uma função com nome descritivo.
- Casos de uso são funções-fábrica que recebem dependências explícitas:

  ```ts
  export function makeUpdateContent(deps: UpdateContentDeps) {
    return async function updateContent(actor: Actor, input: UpdateContentInput) {
      // validar → autorizar → carregar → aplicar regra de domínio → salvar + outbox (mesma transação)
    };
  }
  ```

- Transações pela porta `UnitOfWork`, que entrega repositórios vinculados à transação:
  `uow.transaction(async ({ contents, outbox }) => { ... })`.
- Erros de domínio tipados (`ContentNotFoundError`, `ForbiddenError`, `SlugAlreadyInUseError`),
  convertidos em respostas HTTP ou mensagens de UI **apenas** em `app/`.
- Nomes em inglês no código; textos da interface em português.
- Sem `any`. Sem `as` para silenciar o compilador, exceto na borda após validação com Zod.
- Sem barrel na raiz de `src/`; cada módulo tem um `index.ts` que define sua API pública.
- Sem dependência nova sem justificativa escrita no PR.

---

## 12. Validação de arquitetura

Comando: `pnpm validate:arch` (executa `scripts/validate-architecture.mjs`).

O script verifica:

1. **Ciclos de importação** e **regras de camada** via dependency-cruiser (`.dependency-cruiser.cjs`).
2. **Tamanho de arquivo**: `.tsx` acima de 300 linhas gera erro; `.ts` acima de 400 linhas gera alerta.
3. **Fronteira cliente/servidor**: arquivos com `'use client'` não podem importar código de servidor.

Integração obrigatória:

```jsonc
// package.json (raiz)
{
  "scripts": {
    "validate:arch": "node scripts/validate-architecture.mjs",
    "graph:arch": "depcruise apps/cms/src packages/sdk/src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > architecture.svg"
  },
  "devDependencies": { "dependency-cruiser": "^18", "typescript": "^6" }
}
```

Requisitos para o script funcionar (verificados em teste):

- **TypeScript 6 na raiz.** O dependency-cruiser ainda não suporta o TypeScript 7 (o compilador nativo).
  Sem um TypeScript compatível, ele ignora os arquivos `.ts` e reporta "sem violações" falsamente;
  o script detecta isso e falha. Se o projeto adotar TypeScript 7, mantenha o 6 só para a validação
  até haver suporte.
- **`baseUrl: "."` no `apps/cms/tsconfig.json`**, junto com `"paths": { "@/*": ["./src/*"] }`.
  Sem `baseUrl`, o dependency-cruiser não resolve o alias `@/` e as regras de camada deixam de valer
  para importações com alias.
- O script falha se nenhum módulo for analisado, para que uma configuração quebrada nunca passe como verde.

- CI (GitHub Actions): `typecheck`, `lint`, `test` e `validate:arch` em todo push e PR.
- Pre-commit (opcional, com Husky + lint-staged): `validate:arch`.
- **Nunca** desative uma regra para fazer o build passar. Se uma regra parecer errada, discuta e altere
  a regra explicitamente, com justificativa.

---

## 13. Testes

| Camada | Tipo | O que cobrir |
|---|---|---|
| `domain` | Unidade | Regras de publicação, validação de slug, transições de status |
| `application` | Unidade com repositórios em memória | Cada caso de uso; autorização; evento gravado no outbox |
| `infrastructure` | Integração (Postgres de teste) | Repositórios filtrando por escopo; transação + outbox atômicos |
| `packages/sdk` | Unidade | Assinatura e verificação do webhook (ida e volta), `tagsFor`, rejeição por timestamp |
| Ponta a ponta | Integração | Publicar no CMS → webhook assinado → handler do site chama `revalidateTag` |

Testes de isolamento entre tenants (seção 6.2) são obrigatórios e não podem ser removidos.

---

## 14. Roteiro do MVP

Estimativas para 8 a 12 horas por semana. Cada marco termina com `validate:arch` verde e deploy.

| Marco | Entrega | Estimativa |
|---|---|---|
| M0 | Monorepo, TS strict, lint, Vitest, dependency-cruiser, script de validação, CI | 1 semana |
| M1 | Tenants, sites, usuários, autenticação, memberships, testes de isolamento | 2 semanas |
| M2 | Tipos de conteúdo no SDK, editor de páginas por blocos e configurações do site | 2 a 3 semanas |
| M3 | Content Delivery API, API keys, client do SDK, `tagsFor` | 1 a 2 semanas |
| M4 | Outbox, despachante, assinatura, reenvio, log de entregas, handler do SDK, `site-starter` integrado | 2 semanas |
| M5 | Upload de mídia (R2) | 1 semana |

**Fora do escopo do MVP:** editor genérico de schemas, preview com `draftMode`, histórico de versões,
internacionalização, front-end multi-tenant, RLS, convite de usuários por e-mail. Registre como
melhorias futuras, não implemente.

---

## 15. Como trabalhar neste repositório (instruções para agentes)

1. Leia este arquivo e confira a estrutura atual antes de propor mudanças.
2. Trabalhe em incrementos pequenos e verticais: um caso de uso completo (domínio → aplicação →
   infraestrutura → rota → UI → teste) em vez de uma camada inteira de uma vez.
3. Ao final de cada incremento, rode `pnpm typecheck && pnpm test && pnpm validate:arch`.
4. Se uma tarefa exigir violar uma regra deste guia, pare e explique o conflito em vez de contorná-lo.
5. Não invente APIs do Next.js: confira a documentação da versão instalada.
6. Ao concluir, resuma o que mudou, quais regras foram verificadas e o que ficou pendente.
