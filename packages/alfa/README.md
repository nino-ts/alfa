# alfa

Framework backend TypeScript para **Bun**. Sem dependências de runtime além das APIs nativas do Bun.

> ⏳ **Ainda não publicado no npm.** Use o clone com `bun link`:
>
> ```bash
> git clone https://github.com/nino-ts/alfa && cd alfa && bun install
> cd packages/alfa && bun link
> # em um app: bun link alfa && bunx alfa serve
> ```

## Módulos

| Import | Função |
|---|---|
| `alfa` | `defineApp` + barrel |
| `alfa/http` | `HttpContext`, `compose`, `json`, `text`, `redirect`, `csrf`, cookies |
| `alfa/routing` | `Router`, `defineRoutes`, `route()` tipado |
| `alfa/database` | `defineTable` (builder sobre `Bun.sql`), `migrate` |
| `alfa/validation` | Adapter `StandardSchemaV1` (`parse`, `parseBody`) |
| `alfa/session` | `cookieSession` (HMAC), `redisSession` (`Bun.RedisClient`) |
| `alfa/auth` | `hashPassword`/`verifyPassword`, `hashToken`/`verifyToken`, `guard` |
| `alfa/container` | IoC mínimo com lifecycle |
| `alfa/console` | Kernel de comandos (`serve`, `dev`, `migrate`, `make:*`) |
| `alfa/utils` | `escapeHtml`, `slugify`, `assert`, `toJson` |

## Exemplo

```ts
import { defineApp, http, routing } from "alfa";

const app = defineApp();

routing.get("/", () => http.json({ ok: true })).name("health");

app.listen(3000);
```

## Requisitos

- Bun >= 1.4
- TypeScript 7.x

## Licença

MIT