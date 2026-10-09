import { expect, test } from "bun:test";
import { join } from "node:path";
import { defineApp } from "#alfa";

const dir = join(import.meta.dir, "__fixtures__", "pages");

function app() {
  return defineApp({ dir });
}

test("serves a static page (/)", async () => {
  const res = await app().fetch(new Request("http://localhost/"));
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/html");
  expect(await res.text()).toBe("<h1>home</h1>");
});

test("serves a dynamic page (/blog/:slug)", async () => {
  const res = await app().fetch(
    new Request("http://localhost/blog/hello-world"),
  );
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("post:hello-world");
});

test("serves a JSON API route (/api/health)", async () => {
  const res = await app().fetch(new Request("http://localhost/api/health"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("exposes route params to the handler (/api/users/:id)", async () => {
  const res = await app().fetch(new Request("http://localhost/api/users/42"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ id: "42" });
});

test("serves an optional catch-all (/docs)", async () => {
  const res = await app().fetch(new Request("http://localhost/docs"));
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("docs:");
});

test("serves a nested optional catch-all (/docs/a/b/c)", async () => {
  const res = await app().fetch(new Request("http://localhost/docs/a/b/c"));
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("docs:a/b/c");
});

test("returns 404 for an unknown route", async () => {
  const res = await app().fetch(new Request("http://localhost/nope"));
  expect(res.status).toBe(404);
});
