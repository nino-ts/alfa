/**
 * Command kernel. Kept intentionally small:
 * `migrate`, `make:page`, `make:migration`.
 *
 * `serve`/`dev` were removed — `bun run` and `bun --watch` already do that.
 */

import { dirname } from "node:path";
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

export interface DefaultCommandsOptions {
  /** Pages directory. Default "pages". */
  pagesDir?: string;
  /** Migrations directory. Default "database/migrations". */
  migrationsDir?: string;
}

export function registerDefaultCommands(
  kernel: Kernel,
  options: DefaultCommandsOptions = {},
): Kernel {
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
    name: "make:page",
    description: "Scaffold a route: make:page <path> (e.g. blog/[slug])",
    run: async ({ args, cwd }) => {
      const name = args[0];
      if (!name) {
        console.error("Usage: make:page <path>");
        return 1;
      }
      const pagesDir = options.pagesDir ?? `${cwd}/pages`;
      const target = `${pagesDir}/${name}.ts`;
      if (await Bun.file(target).exists()) {
        console.error(`Already exists: ${target}`);
        return 1;
      }
      await Bun.$`mkdir -p ${dirname(target)}`.quiet();
      await Bun.write(
        target,
        `import type { HttpContext } from "alfa/http";\n\nexport default (ctx: HttpContext) => "TODO: ${name}";\n`,
      );
      console.log(`Created ${target}`);
      return 0;
    },
  });

  kernel.command({
    name: "make:migration",
    description: "Scaffold a migration: make:migration <name>",
    run: async ({ args, cwd }) => {
      const name = args[0];
      if (!name) {
        console.error("Usage: make:migration <name>");
        return 1;
      }
      const dir = options.migrationsDir ?? `${cwd}/database/migrations`;
      await Bun.$`mkdir -p ${dir}`.quiet();
      const stamp = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const target = `${dir}/${stamp}_${name}.sql`;
      await Bun.write(target, `-- ${name}\n`);
      console.log(`Created ${target}`);
      return 0;
    },
  });

  return kernel;
}
