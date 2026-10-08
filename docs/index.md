# alfa

> Framework backend TypeScript 7 para Bun. Zero dependências de runtime.

`alfa` é um framework de backend para [Bun](https://bun.com), escrito em TypeScript 7 e publicado como fonte `.ts` (sem etapa de build). Tudo que o Bun já oferece nativamente é usado direto — o framework não reimplementa servidor HTTP, driver SQL, Redis, hashing, CSRF ou cookies.

## Instalação

> **Status: ainda não publicado no npm.** O nome `alfa` está ocupado por um pacote de
> terceiro e nenhum Trusted Publisher foi configurado. Por enquanto, use
> [`bun link`](#desenvolvimento-local-sem-publicar) a partir do clone.

```bash
# development (sem publicação)
git clone https://github.com/nino-ts/alfa
cd alfa && bun install
cd packages/alfa && bun link
cd packages/create-alfa && bun link

# em um app
bun link alfa
bunx create-alfa myapp
```

Depois que a publicação for habilitada:

```bash
bun add alfa
bunx create-alfa myapp
```

## Requisitos

| Suportado | Não suportado |
|---|---|
| Bun >= 1.4 (runtime + package manager) | Node.js, npm client, yarn, pnpm |
| TypeScript 7.x | — |

## Início rápido

```ts
import { defineApp, http } from "alfa";
import { registerRoutes } from "./routes";

const app = defineApp({ routes: registerRoutes });
app.listen(3000);
```

```ts
// routes.ts
import { http } from "alfa";
import type { Router } from "alfa/routing";

export function registerRoutes(router: Router): void {
  router.get("/api/health", () => http.json({ ok: true })).name("health");
}
```

## Documentação

| Guia | Conteúdo |
|---|---|
| [getting-started.md](./getting-started.md) | Instalação, app mínimo, estrutura de pastas |
| [http.md](./http.md) | `HttpContext`, `compose`, `json`/`text`/`redirect`, `csrf`, cookies |
| [routing.md](./routing.md) | `Router`, params, nomes, `route()` tipado |
| [database.md](./database.md) | `defineTable` sobre `Bun.sql`, migrations |
| [validation.md](./validation.md) | Adapter `StandardSchemaV1` |
| [auth.md](./auth.md) | Senhas, tokens, `guard` |
| [session.md](./session.md) | `cookieSession`, `redisSession` |
| [frontend-stacks.md](./frontend-stacks.md) | HTMX/Alpine, React com `Bun.FileSystemRouter`, API-only |
| [cli.md](./cli.md) | Comandos `alfa` |
| [container.md](./container.md) | IoC: `register`, `make`, `boot` |
| [utils.md](./utils.md) | `escapeHtml`, `slugify`, `assert`, `toJson` |
| [deployment.md](./deployment.md) | Docker, binário compilado, variáveis de ambiente |

## Princípios

1. **Bun-first** — `Bun.serve`, `Bun.sql`, `Bun.redis`, `Bun.password`, `Bun.CSRF`, `Bun.CookieMap`, `Bun.FileSystemRouter` são usados diretamente.
2. **Zero dependência de runtime** — nada além das APIs nativas do Bun.
3. **Fonte TypeScript** — `.ts` publicado, `noEmit`, sem pipeline JS.
4. **Sem `any`, sem suppressions** — `strict` + `noUncheckedIndexedAccess`.
5. **Padrões de mercado** — nomes e APIs alinhados a AdonisJS, Next.js, Drizzle e Hono.

## Índice de documentação

- [Guia completo (llms-full.txt)](./llms-full.txt) — todas as páginas em um único arquivo
- [Índice para agentes (llms.txt)](./llms.txt) — mapa de rotas de leitura

## Licença

MIT