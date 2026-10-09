import { describe, expect, test } from "bun:test";
import type { HttpContext } from "#alfa/http";
import { text } from "#alfa/http";
import { cookieSession } from "#alfa/session";

function ctxFor(req: Request): HttpContext {
  return {
    req,
    params: {},
    query: {},
    cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
  };
}

const secret = "session-secret";

describe("session cookieSession", () => {
  test("set/get round-trips through signed cookie", async () => {
    const bundle = cookieSession({ secret });

    const first = await bundle.middleware(
      ctxFor(new Request("http://x/")),
      async (ctx) => {
        bundle.set(ctx, "userId", 42);
        return text("ok");
      },
    );
    const setCookie = first.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("alfa_session=");
    expect(setCookie.toLowerCase()).toContain("httponly");

    const cookiePair = setCookie.split(";")[0] ?? "";
    const second = await bundle.middleware(
      ctxFor(new Request("http://x/", { headers: { cookie: cookiePair } })),
      async (ctx) => text(String(bundle.get<number>(ctx, "userId"))),
    );
    expect(await second.text()).toBe("42");
  });

  test("tampered cookie is ignored", async () => {
    const bundle = cookieSession({ secret });
    const good = await bundle.middleware(
      ctxFor(new Request("http://x/")),
      async (ctx) => {
        bundle.set(ctx, "role", "admin");
        return text("ok");
      },
    );
    const cookiePair =
      (good.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    const tampered = `${cookiePair.slice(0, -2)}xx`;
    const res = await bundle.middleware(
      ctxFor(new Request("http://x/", { headers: { cookie: tampered } })),
      async (ctx) => text(String(bundle.get(ctx, "role"))),
    );
    expect(await res.text()).toBe("undefined");
  });

  test("destroy clears cookie with maxAge 0", async () => {
    const bundle = cookieSession({ secret });
    const res = await bundle.middleware(
      ctxFor(new Request("http://x/")),
      async (ctx) => {
        await bundle.destroy(ctx);
        return text("bye");
      },
    );
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("alfa_session=;");
    expect(setCookie.toLowerCase()).toMatch(/max-age=0/);
  });

  test("custom cookie name is honored", async () => {
    const bundle = cookieSession({ secret, name: "myapp" });
    const res = await bundle.middleware(
      ctxFor(new Request("http://x/")),
      async () => text("ok"),
    );
    expect(res.headers.get("set-cookie") ?? "").toContain("myapp=");
  });
});
