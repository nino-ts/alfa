import { describe, expect, test } from "bun:test";
import { createContainer } from "#alfa/container";

describe("container", () => {
  test("register + make returns the dependency", async () => {
    const c = createContainer();
    c.register("config", () => ({ debug: true }));
    const config = await c.make<{ debug: boolean }>("config");
    expect(config.debug).toBe(true);
  });

  test("singleton returns the same instance", async () => {
    const c = createContainer();
    let calls = 0;
    c.register("svc", () => {
      calls++;
      return { n: calls };
    });
    const a = await c.make<{ n: number }>("svc");
    const b = await c.make<{ n: number }>("svc");
    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  test("non-singleton creates a new instance each make", async () => {
    const c = createContainer();
    let calls = 0;
    c.register("svc", () => ++calls, { singleton: false });
    expect(await c.make<number>("svc")).toBe(1);
    expect(await c.make<number>("svc")).toBe(2);
  });

  test("factory receives the container (nested deps)", async () => {
    const c = createContainer();
    c.register("db", () => ({ connected: true }));
    c.register("repo", async (container) => ({
      db: await container.make<{ connected: boolean }>("db"),
    }));
    const repo = await c.make<{ db: { connected: boolean } }>("repo");
    expect(repo.db.connected).toBe(true);
  });

  test("eager bindings are resolved and booted on boot()", async () => {
    const c = createContainer();
    let booted = false;
    c.register(
      "eagerSvc",
      () => ({
        boot: () => {
          booted = true;
        },
      }),
      { eager: true },
    );
    await c.boot();
    expect(booted).toBe(true);
  });

  test("make on unknown key throws", async () => {
    const c = createContainer();
    await expect(c.make("missing")).rejects.toThrow("Nothing registered");
  });
});
