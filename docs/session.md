# Session

Duas estratégias prontas, ambas expondo a mesma interface (`get`, `set`, `destroy`).

## Cookie assinado

```ts
import { cookieSession } from "alfa/session";
import { compose } from "alfa/http";

const session = cookieSession({
  secret: process.env.APP_SECRET!,
  name: "sid",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
});

app.router.get("/counter", session.middleware, (ctx) => {
  const count = (session.get<number>(ctx, "count") ?? 0) + 1;
  session.set(ctx, "count", count);
  return http.json({ count });
});
```

O payload é `base64url(json)` + assinatura HMAC-SHA256 (`Bun.CryptoHasher`). Cookie adulterado resulta em sessão vazia, sem erro. O cookie é reescrito na resposta, e `destroy()` o limpa com `maxAge=0`.

## Redis

```ts
import { redisSession } from "alfa/session";

const session = redisSession({
  url: process.env.REDIS_URL,   // padrão: Bun.RedisClient() lê REDIS_URL
  prefix: "myapp:sess:",
  ttl: 60 * 60 * 24 * 7,
});

app.router.get("/cart", session.middleware, async (ctx) => {
  const cart = session.get(ctx, "cart") ?? [];
  return http.json({ cart });
});
```

O id vai no cookie; o conteúdo fica em `prefix + id` com TTL (`EX`). Sessão expirada gera id novo. `destroy()` apaga a chave e limpa o cookie.

## Interface

```ts
interface SessionBundle {
  middleware: Middleware;
  get<T = unknown>(ctx: HttpContext, key: string): T | undefined;
  set(ctx: HttpContext, key: string, value: unknown): void;
  destroy(ctx: HttpContext): Promise<void>;
}
```

O middleware injeta `ctx.session` com um `SessionStore`, o que permite combine com `guard("session")` de `alfa/auth`.

## Troca de estratégia

```ts
const session = process.env.REDIS_URL ? redisSession({}) : cookieSession({ secret });
```

Ambas satisfazem o mesmo contrato, então trocar é uma linha.

## Regras

- `cookieSession` guarda tudo no cookie: dados pequenos apenas (id, role, tema).
- Para volume alto, use `redisSession`.
- `secure` deve ser `true` em produção com HTTPS.