import { describe, expect, test } from "bun:test";
import {
  compose,
  csrf,
  getCookie,
  type HttpContext,
  json,
  type Middleware,
  redirect,
  text,
  withCookie,
} from "#alfa/http";

function ctxFor(req: Request): HttpContext {
  return {
    req,
    params: {},
    query: {},
    cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
  };
}

describe("http json/text/redirect", () => {
  test("json sets content-type and body", async () => {
    const res = json({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });

  test("json respects custom status and keeps explicit content-type", async () => {
    const res = json(
      { a: 1 },
      { status: 201, headers: { "content-type": "application/vnd.api+json" } },
    );
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toBe("application/vnd.api+json");
  });

  test("text sets content-type and body", async () => {
    const res = text("hello", { status: 201 });
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("hello");
  });

  test("redirect defaults to 302 and sets location", () => {
    const res = redirect("/home");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/home");
  });

  test("redirect accepts custom status", () => {
    expect(redirect("/x", 301).status).toBe(301);
  });
});

describe("http cookies", () => {
  test("withCookie appends set-cookie without mutating original", () => {
    const original = text("hi");
    const res = withCookie(
      original,
      new Bun.Cookie("sid", "abc", { path: "/" }),
    );
    expect(res.headers.get("set-cookie")).toContain("sid=abc");
    expect(original.headers.get("set-cookie")).toBeNull();
  });

  test("getCookie reads from ctx cookies", () => {
    const req = new Request("http://x/", { headers: { cookie: "a=1; b=2" } });
    expect(getCookie(ctxFor(req), "b")).toBe("2");
    expect(getCookie(ctxFor(req), "c")).toBeUndefined();
  });
});

describe("http compose", () => {
  test("middlewares run in order and can short-circuit", async () => {
    const calls: string[] = [];
    const mw =
      (label: string): Middleware =>
      async (ctx, next) => {
        calls.push(`before ${label}`);
        const res = await next(ctx);
        calls.push(`after ${label}`);
        return res;
      };
    const app = compose(mw("a"), mw("b"));
    const res = await app(ctxFor(new Request("http://x/")), () => {
      calls.push("handler");
      return text("ok");
    });
    expect(await res.text()).toBe("ok");
    expect(calls).toEqual([
      "before a",
      "before b",
      "handler",
      "after b",
      "after a",
    ]);
  });

  test("middleware can replace response", async () => {
    const block: Middleware = () => text("blocked", { status: 403 });
    const app = compose(block);
    const res = await app(ctxFor(new Request("http://x/")), () =>
      text("never"),
    );
    expect(res.status).toBe(403);
  });
});

describe("http csrf", () => {
  const options = { secret: "test-secret" };

  test("GET generates ctx.csrfToken and passes through", async () => {
    let seen: unknown;
    const res = await csrf(options)(
      ctxFor(new Request("http://x/", { method: "GET" })),
      (ctx) => {
        seen = ctx.csrfToken;
        return text("ok");
      },
    );
    expect(res.status).toBe(200);
    expect(typeof seen).toBe("string");
    expect(String(seen).length).toBeGreaterThan(0);
  });

  test("POST without token is 403", async () => {
    const res = await csrf(options)(
      ctxFor(new Request("http://x/", { method: "POST" })),
      () => text("ok"),
    );
    expect(res.status).toBe(403);
  });

  test("POST with valid token passes", async () => {
    let token = "";
    await csrf(options)(
      ctxFor(new Request("http://x/", { method: "GET" })),
      (ctx) => {
        token = String(ctx.csrfToken);
        return text("ok");
      },
    );
    const res = await csrf(options)(
      ctxFor(
        new Request("http://x/", {
          method: "POST",
          headers: { "x-csrf-token": token },
        }),
      ),
      () => text("ok"),
    );
    expect(res.status).toBe(200);
  });

  test("POST with wrong-secret token is 403", async () => {
    const bad = Bun.CSRF.generate("other-secret");
    const res = await csrf(options)(
      ctxFor(
        new Request("http://x/", {
          method: "POST",
          headers: { "x-csrf-token": bad },
        }),
      ),
      () => text("ok"),
    );
    expect(res.status).toBe(403);
  });
});
