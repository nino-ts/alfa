import { describe, expect, test } from "bun:test";
import { text } from "#alfa/http";
import { createRouter, defineRoutes, route, routeNames } from "#alfa/routing";

describe("routing", () => {
  test("registers and matches GET route", async () => {
    const router = createRouter();
    router.get("/", () => text("home"));
    const res = await router.fetch(new Request("http://x/"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("home");
  });

  test("matches path params and decodes them", async () => {
    const router = createRouter();
    router.get("/users/:id", (ctx) => text(`user ${ctx.params.id}`));
    const res = await router.fetch(new Request("http://x/users/42"));
    expect(await res.text()).toBe("user 42");
  });

  test("does not match wrong method or path", async () => {
    const router = createRouter();
    router.post("/users", () => text("created"));
    expect(
      (await router.fetch(new Request("http://x/users", { method: "POST" })))
        .status,
    ).toBe(200);
    expect((await router.fetch(new Request("http://x/users"))).status).toBe(
      404,
    );
    expect((await router.fetch(new Request("http://x/nope"))).status).toBe(404);
  });

  test("named routes are registered and buildable via route()", async () => {
    const router = createRouter();
    defineRoutes(router, (r) => {
      r.get("/users/:id", (ctx) => text(ctx.params.id ?? "")).name("user.show");
      r.get("/about", () => text("about")).name("about");
    });
    expect(routeNames()).toContain("user.show");
    expect(routeNames()).toContain("about");
    expect(route("about" as never)).toBe("/about");
    expect(route("user.show" as never, { id: 7 } as never)).toBe("/users/7");
    const res = await router.fetch(new Request("http://x/users/9"));
    expect(await res.text()).toBe("9");
  });

  test("route() encodes params and throws on unknown/missing", () => {
    const router = createRouter();
    router.get("/posts/:slug", () => text("x")).name("post.show");
    expect(route("post.show" as never, { slug: "hello world" } as never)).toBe(
      "/posts/hello%20world",
    );
    expect(() => route("missing.name" as never)).toThrow("Unknown route");
    expect(() => route("post.show" as never, {} as never)).toThrow(
      "Missing route param",
    );
  });
});
