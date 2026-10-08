import { describe, expect, test } from "bun:test";
import {
  guard,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyToken,
} from "#alfa/auth";
import type { HttpContext } from "#alfa/http";
import { text } from "#alfa/http";

function ctxFor(req: Request): HttpContext {
  return {
    req,
    params: {},
    cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
  };
}

describe("auth password", () => {
  test("hash/verify round-trip", async () => {
    const hash = await hashPassword("s3cret!");
    expect(hash).not.toBe("s3cret!");
    expect(await verifyPassword("s3cret!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("auth tokens", () => {
  test("hashToken is stable sha256 hex and verifyToken matches", () => {
    const h = hashToken("tok");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyToken("tok", h)).toBe(true);
    expect(verifyToken("other", h)).toBe(false);
  });
});

describe("auth bearer guard", () => {
  const token = "test-token-abc";
  const middleware = guard("bearer", { tokenHashes: [hashToken(token)] });

  test("rejects missing header with 401", async () => {
    const res = await middleware(ctxFor(new Request("http://x/")), () =>
      text("ok"),
    );
    expect(res.status).toBe(401);
  });

  test("rejects wrong token with 401", async () => {
    const req = new Request("http://x/", {
      headers: { authorization: "Bearer nope-nope-nope" },
    });
    expect((await middleware(ctxFor(req), () => text("ok"))).status).toBe(401);
  });

  test("accepts valid token and stores it on ctx.user", async () => {
    const req = new Request("http://x/", {
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await middleware(ctxFor(req), (ctx) =>
      text(`user=${String(ctx.user)}`),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(`user=${token}`);
  });

  test("custom verify function overrides tokenHashes", async () => {
    const mw = guard("bearer", { verify: (t) => t === "magic-token" });
    const ok = new Request("http://x/", {
      headers: { authorization: "Bearer magic-token" },
    });
    expect((await mw(ctxFor(ok), () => text("ok"))).status).toBe(200);
    const bad = new Request("http://x/", {
      headers: { authorization: "Bearer no" },
    });
    expect((await mw(ctxFor(bad), () => text("ok"))).status).toBe(401);
  });
});

describe("auth session guard", () => {
  test("401 without session userId, passes with it", async () => {
    const mw = guard("session");
    const noSession = ctxFor(new Request("http://x/"));
    expect((await mw(noSession, () => text("ok"))).status).toBe(401);

    const ctx = ctxFor(new Request("http://x/"));
    const data = new Map<string, unknown>([["userId", 7]]);
    ctx.session = {
      get: <T = unknown>(k: string) => data.get(k) as T | undefined,
      set: (k: string, v: unknown) => void data.set(k, v),
      destroy: async () => data.clear(),
      all: () => Object.fromEntries(data),
    };
    const res = await mw(ctx, (c) => text(`id=${String(c.user)}`));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("id=7");
  });
});
