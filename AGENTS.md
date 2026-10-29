# AGENTS.md

Guia para agentes de IA (e pessoas) que trabalham neste repositório.
O que o produto é e suas regras: [PRODUCT.md](PRODUCT.md).

## Rodar localmente

```bash
fnm use                     # Node 24.22.2 (.nvmrc)
npm ci
cp .env.example .env.local
npm run db:up               # Postgres 17 em Docker, porta 5433
npm run dev                 # http://localhost:3000
```

Imagem de produção com banco: `docker compose --profile app up --build`.

## Gate (o mesmo do CI)

```bash
npm run lint && npm run typecheck && npm run format:check && npm test && npm run build && npm run test:e2e
```

Nada é commitado com o gate vermelho.

## Convenções

- Interface e textos de produto em português do Brasil; código, comentários técnicos e commits em inglês.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `build:`, `ci:`).
- Teste antes do código: escreva o teste, veja falhar, implemente.
- Acessibilidade: zero violações axe WCAG A/AA, nos temas claro e escuro.
- Nunca commitar `.env.local`; toda variável nova vai para `.env.example`.
- O build não pode depender do banco: nada conecta no import (`getDb()` é sob demanda).
- Rotas que leem dados por requisição chamam `await connection()` (Next 16 com `cacheComponents`).

## Mapa

| Caminho              | O quê                                               |
| -------------------- | --------------------------------------------------- |
| `src/app/`           | Rotas (App Router); `api/health` checa o banco      |
| `src/components/ui/` | Componentes shadcn                                  |
| `src/db/`            | Cliente Drizzle (`getDb`), schema, `getDatabaseUrl` |
| `src/lib/pedidos.ts` | Regras de urgência e etapas (reusadas na etapa 3)   |
| `e2e/`               | Testes Playwright + axe                             |
| `drizzle/`           | Migrations geradas (`npm run db:generate`)          |
| `docs/superpowers/`  | Design e planos de implementação                    |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
