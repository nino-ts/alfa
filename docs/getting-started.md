# Getting started

## Requisitos

- **Bun >= 1.4** — runtime e package manager. Node.js, npm, yarn e pnpm não são suportados.
- **TypeScript 7.x** —peer dependency; o framework publica fontes `.ts` e usa `noEmit`.

## Criar um projeto

```bash
bunx create-alfa myapp
cd myapp
bun install
bun run dev
```

Com template React:

```bash
bunx create-alfa myapp --template react
```

Adicionar a um projeto existente:

```bash
bun add alfa
```

## Estrutura gerada

```
myapp/
├── index.ts        # entry: defineApp + listen
├── routes.ts       # registro de rotas
├── pages/          # index.html (HTMX) ou index.tsx (React)
├── package.json
├── tsconfig.json
└── .env.example
```

## App mínimo

```ts
// index.ts
import { defineApp } from "alfa";
import { registerRoutes } from "./routes";

const app = defineApp({ routes: registerRoutes });

app.listen(Number(process.env.PORT ?? 3000));
```

```ts
// routes.ts
import { http } from "alfa";
import type { Router } from "alfa/routing";

export function registerRoutes(router: Router): void {
  router.get("/api/health", () => http.json({ ok: true })).name("health");
}
```

## Variáveis de ambiente

```
PORT=3000
APP_SECRET=troque-me
DATABASE_URL=sqlite://app.db
REDIS_URL=redis://localhost:6379
```

O Bun carrega `.env` automaticamente. Use `--no-env-file` em produção quando as variáveis vierem do host.

## Scripts

```json
{
  "scripts": {
    "dev": "alfa dev",
    "serve": "alfa serve",
    "migrate": "alfa migrate",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  }
}
```

## Desenvolvimento local do framework

Dentro do monorepo do `alfa`:

```bash
bun install

cd packages/alfa && bun link
cd ../create-alfa && bun link

# em outro projeto
bun link alfa
bun install
bun run dev
```

Sem link global, use caminho absoluto:

```bash
bun add link:/caminho/para/alfa/packages/alfa
```

## tsconfig

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "types": ["bun"]
  }
}
```

`allowImportingTsExtensions: false` é obrigatório: o pacote é consumido como fonte `.ts`, sem extensão nos imports.

## Próximos passos

- [HTTP](./http.md) — middlewares, CSRF, cookies
- [Routing](./routing.md) — rotas nomeadas e params
- [Database](./database.md) — `defineTable` sobre `Bun.sql`
- [Auth](./auth.md) — senhas, tokens, guard
- [Session](./session.md) — cookie assinado ou Redis
- [Frontend stacks](./frontend-stacks.md) — HTMX, React, API-only