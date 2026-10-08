# CLI

O binário `alfa` acompanha o pacote `alfa`.

```bash
bunx alfa            # lista os comandos
bunx alfa serve      # roda o app
bunx alfa dev        # roda com hot reload
bunx alfa migrate    # aplica migrations
```

## Comandos

### `alfa serve`

Executa o entrypoint (`index.ts` por padrão) com Bun.

```bash
bunx alfa serve
```

Para outro entrypoint, chame direto:

```bash
bun run src/server.ts
```

### `alfa dev`

Igual a `serve`, com `--hot` para recarregar o servidor ao editar arquivos.

```bash
bunx alfa dev
```

### `alfa migrate`

Aplica os arquivos `*.sql` de `database/migrations/` em ordem, cada um em transação própria.

```bash
bunx alfa migrate
# Applied 3 migration(s)
```

Usa `DATABASE_URL` do ambiente via `new SQL()`.

### `alfa make:controller <Name>`

Cria `app/controllers/<Name>Controller.ts`.

```bash
bunx alfa make:controller User
```

```ts
import type { HttpContext } from "alfa/http";

export class UserController {
  async index(ctx: HttpContext): Promise<Response> {
    return new Response("UserController#index");
  }
}
```

### `alfa make:migration <nome>`

Cria `database/migrations/<timestamp>_<nome>.sql`.

```bash
bunx alfa make:migration create_users_table
# Created database/migrations/20261008090000_create_users_table.sql
```

## Kernel próprio

O kernel é a mesma API usada internamente:

```ts
import { createKernel, registerDefaultCommands } from "alfa/console";

const kernel = registerDefaultCommands(createKernel(), {
  entry: "src/server.ts",
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

Um `run` retorna o código de saída (0 sucesso, 1 erro), o que torna o kernel fácil de testar.