# CLI

The `alfa` binary ships with the `alfa` package.

```bash
bunx alfa            # list commands
bunx alfa migrate    # apply migrations
bunx alfa make:page blog/[slug]
bunx alfa make:migration create_users
```

`serve` and `dev` are intentionally absent: run the entry directly with Bun.

| Task | Command |
|---|---|
| dev server | `bun --watch index.ts` |
| production | `bun index.ts` |
| run migrations | `bunx alfa migrate` |
| scaffold a route | `bunx alfa make:page <path>` |
| scaffold a migration | `bunx alfa make:migration <name>` |

## `alfa migrate`

Applies `*.ts` migrations from `database/migrations/` in order, each in its own
transaction. Reads `DATABASE_URL` via `new SQL()`. Each migration default-exports
`{ up }`; `down` is optional.

## `alfa make:page <path>`

Creates `pages/<path>.ts`:

```bash
bunx alfa make:page blog/[slug]
# Created pages/blog/[slug].ts
```

```ts
import type { HttpContext } from "alfa/http";

export default (ctx: HttpContext) => "TODO: blog/[slug]";
```

## `alfa make:migration <name>`

Creates `database/migrations/<timestamp>_<name>.ts`:

```ts
import type { Migration } from "alfa/database";

export default {
  async up() {},
} satisfies Migration;
```

Fill `up()` with the blueprint call (`await posts.createTable()`) — the ORM
produces the table, so no SQL is written by hand.

## Custom kernel

```ts
import { createKernel, registerDefaultCommands } from "alfa/console";

const kernel = registerDefaultCommands(createKernel(), {
  pagesDir: "pages",
  migrationsDir: "db/migrations",
});

kernel.command({
  name: "seed",
  description: "Seed the database",
  run: async () => {
    await seed();
    return 0;
  },
});

process.exit(await kernel.run(process.argv.slice(2)));
```

A command returns its exit code (`0` success, `1` error), which keeps the kernel
easy to test.
