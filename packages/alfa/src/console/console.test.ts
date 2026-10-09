import { describe, expect, test } from "bun:test";
import { createKernel, registerDefaultCommands } from "#alfa/console";

describe("console kernel", () => {
  test("registered command runs and returns exit code", async () => {
    const kernel = createKernel();
    kernel.command({
      name: "hello",
      description: "say hi",
      run: ({ args }) => (args[0] === "world" ? 0 : 2),
    });
    expect(await kernel.run(["hello", "world"])).toBe(0);
    expect(await kernel.run(["hello"])).toBe(2);
  });

  test("unknown command returns 1", async () => {
    const kernel = createKernel();
    expect(await kernel.run(["nope"])).toBe(1);
  });

  test("no args lists commands and returns 0", async () => {
    const kernel = createKernel();
    kernel.command({ name: "a", description: "A", run: () => 0 });
    expect(await kernel.run([])).toBe(0);
    expect(kernel.list().map((c) => c.name)).toEqual(["a"]);
  });

  test("default commands are migrate + make:page + make:migration", () => {
    const kernel = registerDefaultCommands(createKernel());
    const names = kernel.list().map((c) => c.name);
    expect(names).toContain("migrate");
    expect(names).toContain("make:page");
    expect(names).toContain("make:migration");
    expect(names).not.toContain("serve");
    expect(names).not.toContain("dev");
    expect(names).not.toContain("make:controller");
  });

  test("make:page without a path returns 1", async () => {
    const kernel = registerDefaultCommands(createKernel());
    expect(await kernel.run(["make:page"])).toBe(1);
  });

  test("make:page scaffolds a route file", async () => {
    const dir = `${process.env.TEMP ?? process.env.TMP ?? "."}/alfa-test-pages-${Date.now()}`;
    const kernel = registerDefaultCommands(createKernel(), { pagesDir: dir });
    expect(await kernel.run(["make:page", "blog/[slug]"])).toBe(0);
    const file = Bun.file(`${dir}/blog/[slug].ts`);
    expect(await file.exists()).toBe(true);
    expect(await file.text()).toContain("HttpContext");
  });

  test("make:migration scaffolds a sql file", async () => {
    const dir = `${process.env.TEMP ?? process.env.TMP ?? "."}/alfa-test-migrations-${Date.now()}`;
    const kernel = registerDefaultCommands(createKernel(), {
      migrationsDir: dir,
    });
    expect(await kernel.run(["make:migration", "create_users"])).toBe(0);
    const { readdirSync } = await import("node:fs");
    const files = readdirSync(dir);
    expect(files.some((f) => f.endsWith("_create_users.sql"))).toBe(true);
  });
});
