# Routing

Rotas declaradas em código (não por convenção de arquivo), com nomes e params tipados.

## Registrar rotas

```ts
import { createRouter } from "alfa/routing";
import { http } from "alfa/http";

const router = createRouter();

router
  .get("/users", (ctx) => http.json({ users: [] }))
  .name("users.index");

router
  .get("/users/:id", (ctx) => http.json({ id: ctx.params.id }))
  .name("users.show");

router
  .post("/users", async (ctx) => http.json(await ctx.req.json(), { status: 201 }))
  .name("users.create");
```

Métodos disponíveis: `get`, `post`, `put`, `patch`, `delete`, `options`, `head`. Todos retornam `{ name() }`, então `.name()` encadeia.

## Path params

`:nome` captura um segmento e injeta em `ctx.params`:

```ts
router.get("/posts/:postId/comments/:commentId", (ctx) =>
  http.json({ post: ctx.params.postId, comment: ctx.params.commentId }),
);
```

Valores são decodificados com `decodeURIComponent`. Asterisco/curly não são especiais.

## Rotas nomeadas

`.name("x")` registra o par nome → `{ path, method }`. O `route()` monta a URL:

```ts
import { route } from "alfa/routing";

route("users.index");                     // "/users"
route("users.show", { id: 42 });          // "/users/42"
```

`route()` lança `Unknown route` para nome inexistente e `Missing route param: <key>` quando falta argumento.

Para type-safety real, declare as rotas por augmenting:

```ts
declare module "alfa/routing" {
  interface RouteRegistryPaths {
    "users.index": "/users";
    "users.show": "/users/:id";
  }
}
```

Com isso `RouteName`, `RouteParamsFor<Name>` e o segundo argumento de `route()` passam a ser checados pelo compilador.

## Integrar com o app

```ts
import { defineApp } from "alfa";

const app = defineApp({ routes: (router) => registerRoutes(router) });
app.listen(3000);
```

`app.fetch` é compatível com `Bun.serve` e devolve `404` quando nada casa. Para customizar:

```ts
const app = defineApp({
  routes: registerRoutes,
  notFound: () => http.json({ error: "not found" }, { status: 404 }),
});
```

## Helpers

```ts
import { defineRoutes, routeNames } from "alfa/routing";

const router = defineRoutes(createRouter(), (r) => {
  r.get("/ping", () => new Response("pong")).name("ping");
});

routeNames(); // ["ping"]
```

## Composição

```ts
const web = createRouter();
const api = createRouter();

api.get("/health", () => http.json({ ok: true })).name("health");

const router = createRouter();
// registre as de api dentro de web conforme precisar
for (const def of api.routes) web.routes.push(def);
```

`Router.routes` é um array público, então composição é direta.

## Regras

- Rotas são registradas por código; não há file-system routing no core (para React, use `Bun.FileSystemRouter` — veja [frontend-stacks](./frontend-stacks.md)).
- O matcher é linear sobre `routes`, em ordem de registro. Para alto volume, prefira `Bun.serve({ routes })` com handlers estáticos.