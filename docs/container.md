# Container

IoC mínimo para registrar e resolver serviços. Sem decorators, sem metadata reflection, sem service location implícito.

## Registrar e resolver

```ts
import { createContainer } from "alfa/container";

const container = createContainer();

container.register("db", () => new SQL(process.env.DATABASE_URL!));
container.register("users", (c) => new UserRepository(await c.make("db")), {
  singleton: true,
});

const repo = await container.make<UserRepository>("users");
```

A factory recebe o próprio container, permitindo resolver dependências em cascata:

```ts
container.register("service", async (c) => {
  const db = await c.make<SQL>("db");
  const mail = await c.make<Mailer>("mail");
  return new UserService(db, mail);
});
```

## Opções

| Opção | Padrão | Efeito |
|---|---|---|
| `singleton` | `true` | Instância única é memorizada após a primeira resolução |
| `eager` | `false` | Resolve e chama `boot()` durante `container.boot()` |

Com `singleton: false`, cada `make` cria uma instância nova — útil para requests.

```ts
container.register("ctx", (c) => buildRequestContext(), { singleton: false });
```

## Lifecycle

```ts
await container.boot();
```

`boot()` é idempotente. Para cada binding `eager`, resolve a instância e, se ela tiver um método `boot()`, chama. Isso permite que serviços (pool de conexões, migrations, workers) se inicializem na partida.

```ts
container.register(
  "migrations",
  async (c) => new Migrator(await c.make<SQL>("db")),
  { eager: true },
);
```

## Erros

`make` lança `Nothing registered for key: <key>` quando não há binding. Falha explícita é intencional: prefira importar o serviço diretamente quando possível e usar o container apenas para casos transversais (DB, mailer, config compartilhada).

## No app

```ts
import { defineApp } from "alfa";

const app = defineApp({
  routes: registerRoutes,
});

app.container.register("clock", () => Date.now);
await app.container.boot();
```

## Regras

- Bindings são resolvidos por chave de string, não por token de tipo. Use `as` no ponto de consumo para manter a tipagem.
- O container não injeta em construtor automaticamente; chame `make` explicitamente.
- Não use o container para evitar imports: ele serve para o grafo de dependências da aplicação, não para MEDIA de imports.