# alfa

TypeScript 7 backend framework for **Bun**. Zero runtime dependencies.

> ⏳ **Not published to npm yet.** Use the clone with `bun link`:
>
> ```bash
> git clone https://github.com/nino-ts/alfa && cd alfa && bun install
> cd packages/alfa && bun link
> # in an app: bun link alfa
> ```

## Routing

File-system routing in `pages/`, delegated to `Bun.FileSystemRouter`:

```
pages/index.ts                 -> /
pages/blog/[slug].ts           -> /blog/:slug
pages/api/users/[id].ts        -> /api/users/:id
pages/docs/[[...slug]].ts      -> /docs, /docs/a, /docs/a/b
```

```ts
// pages/api/users/[id].ts
import type { HttpContext } from "alfa/http";

export default (ctx: HttpContext) => Response.json({ id: ctx.params.id });
```

## Modules

| Import | Role |
|---|---|
| `alfa` | `defineApp` (file-system routing + `Bun.serve`) |
| `alfa/http` | `HttpContext`, `compose`, `json`, `text`, `redirect`, `csrf`, cookies |
| `alfa/routing` | `createAppRouter`, `loadRouteHandler` (thin wrapper over Bun) |
| `alfa/database` | `defineTable` over `Bun.sql`, `migrate` |
| `alfa/validation` | `StandardSchemaV1` adapter (`parse`, `parseBody`) |
| `alfa/session` | `cookieSession` (HMAC), `redisSession` (`Bun.RedisClient`) |
| `alfa/auth` | `hashPassword`/`verifyPassword`, `hashToken`/`verifyToken`, `guard` |
| `alfa/console` | command kernel: `migrate`, `make:page`, `make:migration` |

## Example

```ts
// index.ts
import { defineApp } from "alfa";

defineApp().listen(3000);
```

## Requirements

- Bun >= 1.4
- TypeScript 7.x

## License

MIT
