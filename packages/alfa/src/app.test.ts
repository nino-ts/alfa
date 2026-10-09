import { expect, test } from "bun:test";
import { join } from "node:path";
import { defineApp } from "#alfa";
import type { Middleware } from "#alfa/http";

const dir = join(import.meta.dir, "routing", "__fixtures__", "pages");

test("middleware runs around a matched route", async () => {
  const seen: string[] = [];
  const before: Middleware = async (ctx, next) => {
    seen.push(`before:${new URL(ctx.req.url).pathname}`);
    return next(ctx);
  };
  const after: Middleware = async (ctx, next) => {
    const res = await next(ctx);
    seen.push(`after:${res.status}`);
    return res;
  };

  const app = defineApp({ dir, middleware: [before, after] });
  const res = await app.fetch(new Request("http://localhost/"));

  expect(res.status).toBe(200);
  expect(seen).toEqual(["before:/", "after:200"]);
});

test("middleware can short-circuit", async () => {
  const block: Middleware = () => new Response("blocked", { status: 401 });
  const app = defineApp({ dir, middleware: [block] });
  const res = await app.fetch(new Request("http://localhost/"));
  expect(res.status).toBe(401);
  expect(await res.text()).toBe("blocked");
});

test("middleware can attach state to the context", async () => {
  const tag: Middleware = async (ctx, next) => {
    ctx.tag = "hello";
    return next(ctx);
  };
  const app = defineApp({ dir, middleware: [tag] });
  const res = await app.fetch(new Request("http://localhost/"));
  expect(res.status).toBe(200);
});

test("routes still work with no middleware", async () => {
  const app = defineApp({ dir });
  const res = await app.fetch(new Request("http://localhost/api/health"));
  expect(await res.json()).toEqual({ ok: true });
});
