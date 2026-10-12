# Database

`alfa` inclui um ORM próprio, **construído como extensão de `Bun.sql`** — você não
precisa instalar Prisma, Drizzle, TypeORM ou qualquer outro ORM. A definição de
tabela é fluente, no estilo **Blueprint do Eloquent**; as queries são fluent, no
estilo Drizzle.

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

## Definir tabela (Blueprint)

```ts
import { defineTable } from "alfa/database";
import { db } from "./connection";

interface Post {
  id: number;
  title: string;
  body: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const posts = defineTable<Post>(db, "posts", (table) => {
  table.id();
  table.string("title");
  table.text("body").nullable();
  table.boolean("published").default(false);
  table.timestamps();
});
```

### Tipos de coluna

`id`, `uuid`, `string(name, length?)`, `text`, `integer`, `bigInteger`, `boolean`,
`date`, `dateTime`, `timestamp`, `json`.

### Modificadores encadeáveis

`.nullable()` · `.unique()` · `.default(value)` · `.primary()`

### Atalhos

`table.timestamps()` → `createdAt` + `updatedAt` (**nullable**, como no Eloquent,
para o insert funcionar sem fornecê-los).

## Criar a tabela

```ts
await posts.createTable();   // CREATE TABLE IF NOT EXISTS
await posts.dropTable();
```

O dialeto vem de `db.options.adapter` — nenhuma configuração extra. O SQL gerado:

```ts
import { createTableSQL, dropTableSQL, type Dialect } from "alfa/database";

createTableSQL("postgres", "posts", posts.columns);
dropTableSQL("sqlite", "posts");
```

| Tipo | sqlite | postgres | mysql |
|---|---|---|---|
| `id()` (auto) | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` | `INT AUTO_INCREMENT` + `PRIMARY KEY` |
| `uuid` | `TEXT` | `UUID` | `CHAR(36)` |
| `string` | `TEXT` | `TEXT` | `VARCHAR(255)` |
| `text` | `TEXT` | `TEXT` | `TEXT` |
| `integer` | `INTEGER` | `INTEGER` | `INT` |
| `bigInteger` | `INTEGER` | `BIGINT` | `BIGINT` |
| `boolean` | `INTEGER` | `BOOLEAN` | `TINYINT(1)` |
| `date` | `TEXT` | `DATE` | `DATE` |
| `dateTime` | `TEXT` | `TIMESTAMPTZ` | `DATETIME` |
| `timestamp` | `TEXT` | `TIMESTAMPTZ` | `TIMESTAMP` |
| `json` | `TEXT` | `JSONB` | `JSON` |

Fora do v1: `->index()`, `->foreign()`, `alter`. A app valida o resto.

## Queries

```ts
import { eq } from "alfa/database";

// select
const all = await posts.select().get();

// colunas específicas
const ids = await posts.select(["id", "title"]).get();

// where
const one = await posts.select().where(eq("id", 1)).first();

// where + limite
const page = await posts.select().where(eq("published", true)).limit(10).get();

// insert (um ou vários)
const created = await posts.insert({ title: "Olá", body: "mundo" });
await posts.insert([{ title: "a" }, { title: "b" }]);

// update
await posts.update({ title: "Novo" }).where(eq("id", 1)).exec();

// delete
await posts.delete().where(eq("id", 1)).exec();
```

`insert` devolve as linhas criadas (`RETURNING *`).

## SQL bruto

`table.raw` é o próprio `Bun.SQL` (tagged template):

```ts
const stats = await posts.raw`SELECT role, COUNT(*) AS total FROM posts GROUP BY role`;
```

Placeholders usam numeração `$n` (PostgreSQL/SQLite). O builder gera isso via
`db.unsafe`.

## Migrations (TypeScript)

```ts
// database/migrations/0001_create_posts.ts
import { posts } from "../../lib/db";
import type { Migration } from "alfa/database";

export default {
  async up() {
    await posts.createTable();
  },
  async down() {
    await posts.dropTable();
  },
} satisfies Migration;
```

```bash
bunx alfa make:migration add_published   # cria o stub .ts
bunx alfa migrate                        # aplica database/migrations/*.ts
```

```ts
import { migrate } from "alfa/database";

const applied = await migrate(db, "database/migrations");
```

O runner varre `*.ts` com `Bun.Glob`, ordena por nome e aplica cada arquivo dentro
de `db.begin()` (transação própria por arquivo). Retorna os nomes aplicados.

## Relações

Não existem macros de relação em classe. Relações são joins explícitos:

```ts
const rows = await posts
  .select()
  .join(users, eq(posts.userId, users.id))
  .get();
```

## Regras

- `alfa` não gerencia pool, transações, streaming, `sql.array` nem JSON/JSONB: `Bun.sql` já faz. O ORM expõe, não reimplementa.
- Qualquer feature que dependa de Prisma/Drizzle/TypeORM não entra no core.
- Não há camada de cast: os valores vêm como o driver devolve (booleans em SQLite voltam `0`/`1`).
