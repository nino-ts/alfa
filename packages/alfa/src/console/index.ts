/**
 * Command kernel: serve, dev, migrate, make:controller, make:migration.
 * Bun-native process spawning via Bun.spawn, file output via Bun.write.
 */

import { migrate } from "../database/index";

export interface CommandContext {
  args: string[];
  cwd: string;
}

export type CommandHandler = (
  context: CommandContext,
) => number | Promise<number>;

export interface CommandDefinition {
  name: string;
  description: string;
  run: CommandHandler;
}

export interface Kernel {
  command(definition: CommandDefinition): void;
  list(): readonly CommandDefinition[];
  run(argv: readonly string[]): Promise<number>;
}

export function createKernel(): Kernel {
  const commands = new Map<string, CommandDefinition>();

  return {
    command: (definition) => {
      commands.set(definition.name, definition);
    },
    list: () => [...commands.values()],
    run: async (argv) => {
      const [name, ...args] = argv;
      if (!name) {
        for (const command of commands.values()) {
          console.log(`${command.name}\t${command.description}`);
        }
        return 0;
      }
      const command = commands.get(name);
      if (!command) {
        console.error(`Unknown command: ${name}`);
        return 1;
      }
      return command.run({ args, cwd: process.cwd() });
    },
  };
}

async function spawn(command: string[], cwd: string): Promise<number> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  return proc.exited;
}

export interface DefaultCommandsOptions {
  /** Entry file for serve/dev. Default "index.ts". */
  entry?: string;
  /** Migrations directory. Default "database/migrations". */
  migrationsDir?: string;
}

export function registerDefaultCommands(
  kernel: Kernel,
  options: DefaultCommandsOptions = {},
): Kernel {
  const entry = options.entry ?? "index.ts";

  kernel.command({
    name: "serve",
    description: "Start the app with Bun",
    run: () => spawn([process.execPath, "run", entry], process.cwd()),
  });

  kernel.command({
    name: "dev",
    description: "Start the app with Bun --hot reload",
    run: () => spawn([process.execPath, "--hot", "run", entry], process.cwd()),
  });

  kernel.command({
    name: "migrate",
    description: "Run database migrations",
    run: async () => {
      const { SQL } = await import("bun");
      const db = new SQL();
      try {
        const applied = await migrate(db, options.migrationsDir);
        console.log(
          applied.length > 0
            ? `Applied ${applied.length} migration(s)`
            : "No migrations found",
        );
        return 0;
      } finally {
        await db.close();
      }
    },
  });

  kernel.command({
    name: "make:controller",
    description: "Scaffold a controller stub: make:controller Name",
    run: async ({ args, cwd }) => {
      const name = args[0];
      if (!name) {
        console.error("Usage: make:controller <Name>");
        return 1;
      }
      const path = `${cwd}/app/controllers/${name}Controller.ts`;
      const exists = await Bun.file(path).exists();
      if (exists) {
        console.error(`Already exists: ${path}`);
        return 1;
      }
      await Bun.$`mkdir -p ${`${cwd}/app/controllers`}`.quiet();
      await Bun.write(
        path,
        `import type { HttpContext } from "alfa/http";\n\nexport class ${name}Controller {\n  async index(ctx: HttpContext): Promise<Response> {\n    return new Response("${name}Controller#index");\n  }\n}\n`,
      );
      console.log(`Created ${path}`);
      return 0;
    },
  });

  kernel.command({
    name: "make:migration",
    description: "Scaffold a migration stub: make:migration <name>",
    run: async ({ args, cwd }) => {
      const name = args[0];
      if (!name) {
        console.error("Usage: make:migration <name>");
        return 1;
      }
      const dir = options.migrationsDir ?? `${cwd}/database/migrations`;
      await Bun.$`mkdir -p ${dir}`.quiet();
      const path = `${dir}/${new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14)}_${name}.sql`;
      await Bun.write(path, `-- ${name}\n`);
      console.log(`Created ${path}`);
      return 0;
    },
  });

  return kernel;
}
