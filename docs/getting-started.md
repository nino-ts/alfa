# Getting started

## Requirements

- **Bun >= 1.4** — runtime and package manager. Node.js, npm, yarn and pnpm are not supported.
- **TypeScript 7.x** — peer dependency; the framework publishes `.ts` sources (`noEmit`).

## Status

> **Not published to npm yet.** The name `alfa` is taken by a third party. Until
> that is resolved, use the clone with `bun link`.

```bash
git clone https://github.com/nino-ts/alfa
cd alfa
bun install

cd packages/alfa && bun link
cd ../create-alfa && bun link
```

In your app:

```bash
bunx create-alfa myapp
cd myapp
bun link alfa
bun install
bun --watch index.ts
```

## Project layout

```
myapp/
├── index.ts            # defineApp().listen(...)
├── pages/              # routes (file-system)
│   ├── index.ts        # /
│   └── api/health.ts   # /api/health
└── package.json
```

## Minimal app

```ts
// index.ts
import { defineApp } from "alfa";

defineApp().listen(Number(process.env.PORT ?? 3000));
```

```ts
// pages/index.ts
export default () => "<h1>Hello alfa</h1>";
```

```ts
// pages/api/health.ts
export default () => Response.json({ ok: true });
```

## Environment variables

```
PORT=3000
APP_SECRET=change-me
DATABASE_URL=sqlite://app.db
REDIS_URL=redis://localhost:6379
```

Bun loads `.env` automatically. Use `--no-env-file` when variables come from the host.

## Scripts

```json
{
  "scripts": {
    "dev": "bun --watch index.ts",
    "start": "bun index.ts",
    "migrate": "bunx alfa migrate",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  }
}
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

`allowImportingTsExtensions: false` is required: the package is consumed as `.ts`
sources, imported without extension.

## Next

- [Routing](./routing.md) — `pages/`, params, catch-all
- [HTTP](./http.md) — `HttpContext`, middleware, CSRF, cookies
- [Database](./database.md) — `defineTable` over `Bun.sql`
- [Validation](./validation.md) — Standard Schema adapter
- [Auth](./auth.md) — passwords, tokens, guard
- [Session](./session.md) — signed cookie or Redis
- [Frontend stacks](./frontend-stacks.md) — HTMX, React, Vue, API-only
- [CLI](./cli.md) — `alfa` commands
- [Deployment](./deployment.md) — compiled binary, Docker
