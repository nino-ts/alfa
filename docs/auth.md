# Auth

Primitivas de autenticação construídas sobre `Bun.password` e `Bun.CryptoHasher`. `alfa` não traz Passport, JWT nem OAuth — apenas o núcleo.

## Senhas

```ts
import { hashPassword, verifyPassword } from "alfa/auth";

const hash = await hashPassword("senha-forte");
// $argon2id$v=19$m=65536,t=2,p=1$…

await verifyPassword("senha-forte", hash); // true
```

`Bun.password` usa Argon2id por padrão; bcrypt está disponível passando `algorithm`. O algoritmo fica codificado no hash, então `verifyPassword` detecta automaticamente.

## Tokens opacos

```ts
import { hashToken, verifyToken } from "alfa/auth";

const digest = hashToken(rawToken);          // sha256 hex
verifyToken(rawToken, digest);               // true
```

Guarde apenas o digest no banco. Para comparação em memória, use `verify`.

## Guard

```ts
import { guard } from "alfa/auth";

// por token
router.get("/api/me", guard("bearer", { tokenHashes: [digest] }), (ctx) =>
  http.json({ subject: ctx.user }),
);

// com verificador próprio (ex.: consulta ao banco)
router.get("/api/admin", guard("bearer", {
  verify: async (token) => Boolean(await sessions.find(hashToken(token))),
}), handler);

// por sessão
router.post("/logout", guard("session"), (ctx) => http.json({ ok: true }));
```

Opções:

| Opção | Padrão | Descrição |
|---|---|---|
| `tokenHashes` | — | Lista de digests aceitos (modo `bearer`) |
| `verify` | — | Verificador customizado; tem precedência sobre `tokenHashes` |
| `sessionKey` | `userId` | Chave no `ctx.session` (modo `session`) |
| `contextKey` | `user` | Chave em `ctx` onde o sujeito é gravado |

Falhas retornam `401` em JSON.

## Fluxo típico

```ts
router.post("/login", async (ctx) => {
  const { email, password } = await parseBody(LoginSchema, ctx);
  const user = await usersTable.select().where(eq("email", email)).first();

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return http.json({ error: "invalid credentials" }, { status: 401 });
  }

  const raw = crypto.randomUUID();
  await sessions.insert({ userId: String(user.id), tokenHash: hashToken(raw) });

  return withCookie(
    http.json({ ok: true }),
    new Bun.Cookie("session", raw, { httpOnly: true, secure: true, sameSite: "lax" }),
  );
});
```

## Regras

- `alfa` não assina JWT: use tokens opacos, que são revogáveis.
- Tokens não devem ser comparados em tempo constante com `===` sobre o valor bruto; compare digests ou use `verify`.
- Hash de senha usa `Bun.password` — não implemente KDF própria.