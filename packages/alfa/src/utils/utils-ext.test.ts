import { describe, expect, test } from "bun:test";
import { assert, escapeHtml, slugify, toJson } from "#alfa/utils";

describe("utils escapeHtml", () => {
  test("escapes all special chars", () => {
    expect(escapeHtml(`<a href="x">&'hi'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;hi&#39;&lt;/a&gt;",
    );
  });

  test("leaves safe text untouched", () => {
    expect(escapeHtml("plain text 123")).toBe("plain text 123");
  });
});

describe("utils slugify", () => {
  test("basic slug", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  test("strips diacritics", () => {
    expect(slugify("Olá, Mundo Ção")).toBe("ola-mundo-cao");
  });

  test("collapses separators and trims dashes", () => {
    expect(slugify("  --Foo   Bar--  ")).toBe("foo-bar");
  });
});

describe("utils assert", () => {
  test("passes on truthy, throws on falsy", () => {
    expect(() => assert(1)).not.toThrow();
    expect(() => assert(0, "boom")).toThrow("boom");
    expect(() => assert(undefined)).toThrow("Assertion failed");
  });
});

describe("utils toJson", () => {
  test("serializes and falls back to null", () => {
    expect(toJson({ a: 1 })).toBe('{"a":1}');
    expect(toJson(undefined)).toBe("null");
  });
});
