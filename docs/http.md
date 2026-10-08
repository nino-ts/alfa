# HTTP

Primitivas de request/response sobre as Web APIs padrão (`Request`, `Response`, `Headers`). `alfa` não reimplementa parsing HTTP — quem faz isso é o `Bun.serve`.

## HttpContext

```ts
import type { HttpContext } from "alfa/http";

interface HttpContext {
  readonly req: Request;
  params: Record<string, string>;   // path params (/users/:id)
  cookies: Bun.CookieMap;           // cookies do request
  [key: string]: unknown;           // bag: session, user, csrfToken...
}
```

O índice aberto permite anexar estado por middleware sem alterar a assinatura dos handlers.

## Helpers de resposta

```ts
import { json, text, redirect } from "alfa/http";

json({ ok: true });                        // application/json
json({ ok: true }, { status: 201 });       // com status
text("plain", { status: 404 });            // text/plain
redirect("/login");                       // 302
redirect("/login", 301);                  // 301
```

`json` e `text` definem `content-type` apenas se ausente, preservando headers passados em `init`.

## Middlewares

```ts
import { compose } from "alfa/http";
import type { Middleware } from "alfa/http";

const logger: Middleware = async (ctx, next) => {
  const start = performance.now();
  const res = await next(ctx);
  console.log(ctx.req.method, ctx.req.url, res.status, `${performance.now() - start}ms`);
  return res;
};

const withTiming: Middleware = async (ctx, next) => {
  const res = await next(ctx);
  res.headers.set("server-timing", "app;dur=0");
  return res;
};
```

```ts
const handler = compose(logger, withTiming);
const res = await handler(ctx, () => routeHandler(ctx));
```

`compose` garante execução da esquerda para a direita e lança erro se `next()` for chamado mais de uma vez no mesmo nível.

## CSRF

```ts
import { csrf } from "alfa/http";

app.router.use(
  csrf({
    secret: process.env.APP_SECRET!,
    header: "x-csrf-token",   // padrão
    expiresIn: 60 * 60 * 1000,
    sessionId: (ctx) => ctx.session?.id,   // amarra o token ao usuário
  }),
);
```

Comportamento:

- Métodos seguros (`GET`, `HEAD`, `OPTIONS`) geram `ctx.csrfToken`.
- Métodos mutantes exigem header válido; caso contrário, `403`.
- A verificação usa `Bun.CSRF.verify` — o Bun assina o token com HMAC.

No template HTML:

```html
<input type="hidden" name="_csrf" value="{{ token }}" />
```

## Cookies

```ts
import { getCookie, withCookie } from "alfa/http";

const theme = getCookie(ctx, "theme");            // string | undefined

const res = http.json({ ok: true });
const withSession = withCookie(
  res,
  new Bun.Cookie("sid", value, { httpOnly: true, secure: true, maxAge: 3600 }),
);
```

`withCookie` não muta a response original: cria uma nova com `set-cookie` anexado.

## Criando um contexto manualmente

```ts
const ctx: HttpContext = {
  req: request,
  params: {},
  cookies: new Bun.CookieMap(request.headers.get("cookie") ?? ""),
};
```

## Regras

- Handlers recebem `HttpContext`, não `Request` cru — é o que permite params tipados e o bag de estado.
- `alfa` não faz parse de body; use `await ctx.req.json()` ou `parseBody` de `alfa/validation`.