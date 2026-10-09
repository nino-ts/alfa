# alfa

> TypeScript 7 backend framework for Bun. Zero runtime dependencies.

`alfa` is a backend framework for [Bun](https://bun.com). Routing is file-system
based, delegated to [`Bun.FileSystemRouter`](https://bun.com/docs/runtime/file-system-router);
every other primitive is the Bun-native API. The framework does not reimplement the
HTTP server, SQL driver, Redis, hashing, CSRF or cookies.

## Status

> **Not published to npm yet.** The name `alfa` is taken by a third party, so use
> the clone with `bun link` (see [getting-started](./getting-started.md)).

## Install (local)

```bash
git clone https://github.com/nino-ts/alfa
cd alfa && bun install
cd packages/alfa && bun link
cd ../create-alfa && bun link

# in an app
bunx create-alfa myapp
cd myapp && bun link alfa && bun install
bun --watch index.ts
```

## Quick start

```ts
// index.ts
import { defineApp } from "alfa";

defineApp().listen(3000);
```

```ts
// pages/index.ts
export default () => "<h1>Hello alfa</h1>";
```

```ts
// pages/api/health.ts
export default () => Response.json({ ok: true });
```

## Pillars

1. **Bun native** — `Bun.serve`, `Bun.FileSystemRouter`, `Bun.sql`, `Bun.redis`,
   `Bun.password`, `Bun.CSRF`, `Bun.CookieMap`, `Bun.escapeHTML` used directly.
2. **Simplicity** — small surface, no build step, zero runtime dependencies,
   nothing Bun already does.
3. **Batteries included** — database (ORM), validation, auth, session, http, console.
4. **Developer experience** — TypeScript 7, `llms.txt`, clear errors.

## Requirements

| Supported | Not supported |
|---|---|
| Bun >= 1.4 (runtime + package manager) | Node.js, npm client, yarn, pnpm |
| TypeScript 7.x | — |

## Documentation

| Guide | Contents |
|---|---|
| [getting-started.md](./getting-started.md) | install, minimal app, layout |
| [http.md](./http.md) | `HttpContext`, `compose`, `json`/`text`/`redirect`, `csrf`, cookies |
| [routing.md](./routing.md) | `pages/`, params, catch-all, `defineApp` |
| [database.md](./database.md) | `defineTable` over `Bun.sql`, migrations |
| [validation.md](./validation.md) | `StandardSchemaV1` adapter |
| [auth.md](./auth.md) | passwords, opaque tokens, `guard` |
| [session.md](./session.md) | `cookieSession`, `redisSession` |
| [frontend-stacks.md](./frontend-stacks.md) | HTMX/Alpine, React, Vue, API-only |
| [cli.md](./cli.md) | `alfa migrate`, `make:page`, `make:migration` |
| [deployment.md](./deployment.md) | compiled binary, Docker, env |

## Documentation index

- [Full guide (llms-full.txt)](./llms-full.txt) — every page in one file
- [Index for agents (llms.txt)](./llms.txt) — reading map

## License

MIT
