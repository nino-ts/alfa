# Database

`alfa` inclui um ORM próprio, **construído como extensão de `Bun.sql`** — você não precisa instalar Prisma, Drizzle, TypeORM ou qualquer outro ORM. A API é fluent, no estilo Drizzle.

## Conexão

```ts
import { SQL } from "bun";

export const db = new SQL(process.env.DATABASE_URL);
```

`Bun.sql` detecta o driver pela URL, sem configuração extra:

| URL | Driver |
|---|---|
| `postgres://…` / `postgresql://…` (ou qualquer outra) | PostgreSQL |
| `mysql://…` / `mysql2://…` | MySQL / MariaDB |
| `sqlite://app.db`, `file://./app.db`, `:memory:` | SQLite |

## Definir tabela

```ts
import { defineTable } from "alfa/database";
import { db } from "./database";

interface UserRow {
  id: number;
  name: string;
  email: string;
}

export const users = defineTable<UserRow>(db, {
  name: "users",
  columns: {
    id: "number",
    name: "string",
    email: "string",
  },
});
```

O primeiro parâmetro genérico define a forma da linha (`Row = Record<string, unknown>` por padrão). `TableDefinition` aceita `columns` como mapa de tipos (`string` | `number` | `boolean` | `date` | `json`).

## Consultas

```ts
import { eq } from "alfa/database";

// select
const all = await users.select().get();

// colunas específicas
const emails = await users.select(["id", "email"]).get();

// where
const one = await users.select().where(eq("email", email)).first();

// where composto + limite
const page = await users.select().where(eq("active", true)).limit(10).get();

// insert (um ou vários)
await users.insert({ name: "João", email: "joao@example.com" });
await users.insert([{ name: "Ana" }, { name: "Bia" }]);

// update
await users.update({ name: "João Silva" }).where(eq("id", 1)).run();

// delete
await users.delete().where(eq("id", 1)).run();
```

## SQL bruto

`table.raw` é o próprio `Bun.SQL` (tagged template):

```ts
const stats = await users.raw`SELECT role, COUNT(*) as total FROM users GROUP BY role`;
```

Placeholders usam numeração `$n` (PostgreSQL). O builder gera isso via `db.unsafe`.

## Migrations

```bash
bunx alfa make:migration create_users_table
bunx alfa migrate
```

```
database/migrations/
  20261008090000_create_users_table.sql
```

```ts
import { migrate } from "alfa/database";

const applied = await migrate(db, "database/migrations");
```

O runner varre `*.sql` com `Bun.Glob`, ordena por nome e aplica cada arquivo dentro de `db.begin()` (transação própria por arquivo). Retorna os nomes aplicados.

## Relações

Não existem macros de relação em classe. Relações são joins explícitos:

```ts
const rows = await users
  .select()
  .join(posts, eq(posts.userId, users.id))
  .get();
```

## Regras

- `alfa` não gerencia pool, transações, streaming, `sql.array` nem JSON/JSONB: `Bun.sql` já faz. O ORM expõe, não reimplementa.
- Qualquer feature que dependa de Prisma/Drizzle/TypeORM não entra no core.