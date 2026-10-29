# Etapa 1 — Base técnica: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a demo descartável por uma base de produção (Next 16, Postgres + Drizzle, Docker, CI, testes, acessibilidade, docs para agentes) com uma tela inicial "em desenvolvimento".

**Architecture:** App Next.js 16 (App Router) em `src/`. Postgres local via `compose.yaml`, acessado por Drizzle com driver `postgres` (postgres-js); ainda sem tabelas de negócio. Uma rota `GET /api/health` prova a ligação app ↔ banco. Imagem Docker com `output: "standalone"`. CI no GitHub Actions roda o mesmo gate que roda local.

**Tech Stack:** Node 24.22.2, Next.js 16.4.3, TypeScript, Tailwind 4, shadcn 4.23, Drizzle ORM 0.45 / drizzle-kit 0.31, postgres 3.4, Vitest 5, Playwright 1.64 + @axe-core/playwright 4.14, Prettier 3.9, typescript-eslint 8.

**Spec:** `docs/superpowers/specs/2026-10-28-controle-pedidos-design.md` (seções "Base técnica" e "Etapas → 1").

## Global Constraints

- Idioma da interface e dos textos de produto: português do Brasil (`<html lang="pt-BR">`).
- Node fixado em `.nvmrc` = `24.22.2`; `package.json` `"engines": { "node": ">=24" }`.
- Nenhuma tabela de negócio nesta etapa (`src/db/schema.ts` existe, sem tabelas).
- `src/lib/pedidos.ts` e seus testes **ficam** (serão usados na etapa 3); a tela da demo (`src/app/page.tsx` atual) sai.
- `.env.local` nunca é commitado; toda variável aparece em `.env.example`.
- Acessibilidade: zero violações axe com tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.
- Postgres do compose exposto na porta do host **5433** (evita conflito com Postgres local na 5432).
- Gate completo = `npm run lint && npm run typecheck && npm run format:check && npm test && npm run build && npm run test:e2e`.

## Review Focus

1. **Build sem banco:** `npm run build` (e o `docker build`) deve passar sem `DATABASE_URL` e sem Postgres rodando — nada pode conectar no import. Teste em Task 2 (build sem env) e Task 4 (docker build).
2. **Banco fora do ar:** com Postgres parado, `GET /api/health` responde 503 `{ status: "degraded", database: "down" }` em até ~3s, não 500 nem trava. Teste em Task 2.
3. **`DATABASE_URL` ausente em runtime:** erro com mensagem clara citando `DATABASE_URL` e `.env.example`, não `undefined` genérico. Teste em Task 2.
4. **Celular (375px):** a tela inicial não tem rolagem horizontal. Teste em Task 3.
5. **Container como root / fuso:** a imagem roda como usuário não-root e com `TZ=America/Sao_Paulo` (a regra de "vence hoje" depende do fuso local). Verificação em Task 4.

---

### Task 1: Reconstruir o projeto em Next 16 com lint, formatação e Vitest

**Files:**
- Replace (gerado por `create-next-app@16.4.3`): `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `.gitignore`
- Create: `.nvmrc`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`
- Modify: `src/lib/pedidos.test.ts` (migrar de `node:test` para Vitest)
- Keep sem mudar lógica: `src/lib/pedidos.ts`
- Delete: `README.md` da demo (reescrito na Task 5)

**Interfaces:**
- Produces: scripts npm `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format` (`prettier --write .`), `format:check` (`prettier --check .`), `test` (`vitest run`). Alias `@/*` → `src/*`.

- [ ] **Step 1:** Gerar o projeto em diretório temporário (o nome da pasta `InventoryControl` tem maiúscula e o npm recusa):
  `npx -y create-next-app@16.4.3 controle-pedidos --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --disable-git` dentro do scratchpad. Copiar para a raiz do repo, sobrescrevendo os arquivos listados em "Replace". Não copiar `README.md`. Remover `public/*.svg` gerados. Garantir `"name": "controle-pedidos"`.
- [ ] **Step 2:** Criar `.nvmrc` com `24.22.2`; adicionar `"engines": { "node": ">=24" }`. Rodar `fnm use` e `node -v` → `v24.22.2`.
- [ ] **Step 3:** ESLint tipado: adicionar `typescript-eslint` e estender `tseslint.configs.recommendedTypeChecked` com `parserOptions.projectService: true`, aplicado a `**/*.{ts,tsx}`; ignorar `*.config.*`, `.next/**`, `drizzle/**`, `playwright-report/**`, `test-results/**`. Adicionar `eslint-config-prettier` por último.
- [ ] **Step 4:** Prettier: `.prettierrc.json` = `{ "printWidth": 100 }`; `.prettierignore` com `.next`, `drizzle`, `package-lock.json`, `.superpowers`, `.playwright-mcp`, `playwright-report`, `test-results`. Rodar `npm run format`.
- [ ] **Step 5:** Vitest: instalar `vitest`; `vitest.config.ts` com `resolve.tsconfigPaths: true` (ou plugin equivalente da versão), `test.include: ["src/**/*.test.ts"]`, `test.environment: "node"`. Migrar `src/lib/pedidos.test.ts` para `import { test, expect } from "vitest"` e import `./pedidos` sem extensão; manter os 5 testes e as asserções atuais. Remover `allowImportingTsExtensions` e `"type": "module"` se o scaffold não os trouxer.
- [ ] **Step 6:** Trocar `src/app/page.tsx` por placeholder mínimo `<main><h1>Controle de pedidos</h1></main>`; `layout.tsx` com `lang="pt-BR"`, `title: "Controle de pedidos"`.
- [ ] **Step 7:** Rodar `npm run lint && npm run typecheck && npm run format:check && npm test && npm run build`. Esperado: tudo verde, `5 passed`.
- [ ] **Step 8:** Commit: `chore: rebuild project on Next 16 with typed lint, prettier and vitest`.

### Task 2: Postgres em Docker, Drizzle e rota de saúde

**Files:**
- Create: `compose.yaml`, `.env.example`, `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/env.ts`, `src/db/env.test.ts`, `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces:
  - `getDatabaseUrl(env?: NodeJS.ProcessEnv): string` em `src/db/env.ts` — lança `Error` com mensagem contendo `"DATABASE_URL"` e `".env.example"` se ausente/vazia.
  - `getDb(): PostgresJsDatabase<typeof schema>` em `src/db/index.ts` — cria cliente sob demanda (singleton em `globalThis` para não multiplicar conexões no hot reload). **Nada conecta no import.**
  - `GET /api/health` → `200 { status: "ok", database: "ok" }` ou `503 { status: "degraded", database: "down" }`, com `dynamic = "force-dynamic"`.
  - Scripts: `db:up` (`docker compose up -d --wait db`), `db:down` (`docker compose down`), `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`), `db:studio`.

- [ ] **Step 1: Testes que falham** em `src/db/env.test.ts`:
  - `getDatabaseUrl({ DATABASE_URL: "postgres://x" })` → `"postgres://x"`.
  - `getDatabaseUrl({})` e `getDatabaseUrl({ DATABASE_URL: "" })` lançam, e a mensagem contém `DATABASE_URL` e `.env.example`.
- [ ] **Step 2:** `npm test` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `getDatabaseUrl`. `npm test` → PASS.
- [ ] **Step 4: Testes da rota** em `src/app/api/health/route.test.ts`, mockando `@/db` com `vi.mock`:
  - banco responde a `select 1` → status 200, corpo `{ status: "ok", database: "ok" }`.
  - `execute` rejeita → status 503, corpo `{ status: "degraded", database: "down" }`.
  - `execute` nunca resolve → 503 em menos de 3500 ms (use timeout de 3000 ms na rota; `vi.useFakeTimers` permitido).
- [ ] **Step 5:** `npm test` → FAIL.
- [ ] **Step 6:** Implementar `src/db/index.ts` (drizzle + postgres-js, `connect_timeout: 3`) e a rota (`db.execute(sql\`select 1\`)` em `Promise.race` com timeout de 3000 ms; qualquer erro → 503; logar o erro com `console.error`). `npm test` → PASS.
- [ ] **Step 7:** Infra:
  - `compose.yaml`: serviço `db` com `postgres:17-alpine`, `POSTGRES_USER=app`, `POSTGRES_PASSWORD=app`, `POSTGRES_DB=controle_pedidos`, porta `5433:5432`, volume nomeado `db-data`, healthcheck `pg_isready -U app -d controle_pedidos`.
  - `.env.example`: `DATABASE_URL=postgres://app:app@localhost:5433/controle_pedidos` com comentário "copie para .env.local".
  - `drizzle.config.ts`: `dialect: "postgresql"`, `schema: "./src/db/schema.ts"`, `out: "./drizzle"`, `dbCredentials.url` via `getDatabaseUrl()`; carregar `.env.local` com `process.loadEnvFile` se existir.
  - `src/db/schema.ts`: só um comentário dizendo que as tabelas chegam na etapa 3 e `export {}`.
- [ ] **Step 8: Verificação manual:**
  - `cp .env.example .env.local && npm run db:up && npm run dev`; `curl -s -w " %{http_code}" localhost:3000/api/health` → `{"status":"ok","database":"ok"} 200`.
  - `docker compose stop db`; mesmo curl → `{"status":"degraded","database":"down"} 503` em até ~3s.
  - `env -u DATABASE_URL npm run build` (com `.env.local` renomeado temporariamente) → build verde.
- [ ] **Step 9:** Gate completo verde. Commit: `feat: add postgres via docker compose, drizzle and health endpoint`.

### Task 3: Tela inicial "em desenvolvimento" com shadcn e testes de acessibilidade

**Files:**
- Create: `components.json` (via `npx shadcn@4.23.0 init`), `src/components/ui/card.tsx`, `src/components/ui/badge.tsx` (via `shadcn add card badge`), `src/lib/utils.ts` (gerado), `playwright.config.ts`, `e2e/home.spec.ts`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `package.json`, `.gitignore`

**Interfaces:**
- Produces: script `test:e2e` (`playwright test`). Playwright sobe o app com `webServer: { command: "npm run build && npm run start", port: 3000, reuseExistingServer: !process.env.CI }`, projeto `chromium` só.

- [ ] **Step 1: Testes que falham** em `e2e/home.spec.ts`:
  - `"mostra o produto e o aviso de desenvolvimento"`: `getByRole("heading", { level: 1 })` contém `"Controle de pedidos"`; texto `"Em desenvolvimento"` visível.
  - `"sem violações WCAG A/AA"`: `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze()` → `violations` igual a `[]`.
  - `"sem rolagem horizontal no celular"`: viewport `375x812`; `document.documentElement.scrollWidth <= 375`.
- [ ] **Step 2:** `npx playwright install chromium && npm run test:e2e` → FAIL (heading/texto ausentes).
- [ ] **Step 3:** Implementar a tela com Card e Badge do shadcn. Copy exata:
  - Badge no cabeçalho: `Em desenvolvimento`
  - H1: `Controle de pedidos`
  - Subtítulo: `Do momento da venda até o envio: veja o que precisa ser feito agora e o que está para atrasar.`
  - Card título: `Estamos preparando o primeiro passo`
  - Card texto: `A fila de pedidos ainda não está disponível. As funcionalidades chegarão uma por vez.`
  Visual a cargo do implementador; usar tokens do shadcn, suportar modo claro e escuro.
- [ ] **Step 4:** `npm run test:e2e` → 3 passed. Adicionar `playwright-report/` e `test-results/` ao `.gitignore`.
- [ ] **Step 5:** Gate completo verde. Commit: `feat: add in-development home page with shadcn and a11y e2e tests`.

### Task 4: Imagem Docker da aplicação

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Modify: `next.config.ts` (`output: "standalone"`), `compose.yaml` (serviço `app` opcional, profile `app`)

**Interfaces:**
- Consumes: `GET /api/health` (Task 2).
- Produces: imagem que escuta na porta 3000, configurada só por `DATABASE_URL`.

- [ ] **Step 1:** `Dockerfile` multi-stage em `node:24.22.2-alpine`: `deps` (`npm ci`), `build` (`npm run build`, sem `DATABASE_URL`), `runner` copiando `.next/standalone`, `.next/static`, `public`; `ENV NODE_ENV=production TZ=America/Sao_Paulo PORT=3000 HOSTNAME=0.0.0.0`; instalar `tzdata`; `USER node`; `CMD ["node","server.js"]`; `HEALTHCHECK` usando `wget -qO- http://127.0.0.1:3000/api/health`.
- [ ] **Step 2:** `.dockerignore`: `node_modules`, `.next`, `.git`, `.env*` (exceto `.env.example`), `.superpowers`, `.playwright-mcp`, `playwright-report`, `test-results`, `docs`.
- [ ] **Step 3:** `compose.yaml`: serviço `app` com `build: .`, `profiles: ["app"]`, `depends_on: db (service_healthy)`, `DATABASE_URL=postgres://app:app@db:5432/controle_pedidos`, porta `3000:3000`.
- [ ] **Step 4: Verificação:**
  - `docker build -t controle-pedidos .` → sucesso sem `.env.local` no contexto.
  - `docker compose --profile app up -d --build --wait` → `curl -s localhost:3000/api/health` → `{"status":"ok","database":"ok"}`.
  - `docker compose exec app whoami` → `node`; `docker compose exec app date +%Z` → `-03`.
  - `docker compose --profile app down`.
- [ ] **Step 5:** Gate completo verde. Commit: `build: add production Dockerfile with standalone output`.

### Task 5: CI no GitHub e documentação para pessoas e agentes

**Files:**
- Create: `.github/workflows/ci.yml`, `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, `README.md`

**Interfaces:**
- Consumes: todos os scripts das Tasks 1–3; `Dockerfile` da Task 4.

- [ ] **Step 1:** `ci.yml`, disparado em `push` para `main` e em `pull_request`:
  - job `check`: `actions/setup-node` com `node-version-file: .nvmrc` e cache npm; `npm ci`; `lint`, `typecheck`, `format:check`, `test`, `build`; `npx playwright install --with-deps chromium`; `test:e2e`; upload de `playwright-report/` se falhar.
  - job `docker`: `docker build .` (sem push).
- [ ] **Step 2:** Validar o YAML: `npx --yes @action-validator/cli .github/workflows/ci.yml` (ou `actionlint` se instalado) → sem erros. Rodar o gate completo localmente com os mesmos comandos do job.
- [ ] **Step 3:** `PRODUCT.md` (pt-BR): o que é, para quem, problema, papéis Dono/Equipe, etapas Novo → Separado → Embalado → Enviado, regras de urgência, regras de correção/desfazer, regra "Cancelado — não enviar", não-objetivos. Fonte: o spec; linkar para ele.
- [ ] **Step 4:** `AGENTS.md`: como rodar (`fnm use`, `npm ci`, `cp .env.example .env.local`, `npm run db:up`, `npm run dev`), o gate completo, convenções (pt-BR na UI, inglês em código e commits, Conventional Commits, testes antes de código, nunca commitar `.env.local`), mapa de pastas, link para `PRODUCT.md` e para o spec. `CLAUDE.md` contém apenas `@AGENTS.md`.
- [ ] **Step 5:** `README.md` curto: descrição em uma frase, início rápido (mesmos comandos do `AGENTS.md`), link para `PRODUCT.md`.
- [ ] **Step 6:** `npm run format:check` verde. Commit: `ci: add github actions gate and project docs`.
- [ ] **Step 7:** Não fazer push sem pedir. Ao final, informar ao usuário que o CI só roda depois do push para o GitHub.
