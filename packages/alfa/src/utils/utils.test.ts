import { expect, test } from "bun:test";
import { escapeHtml } from "#alfa/utils";

test("escapeHtml", () => {
  expect(escapeHtml('<div class="a">hello</div>')).toBe(
    "&lt;div class=&quot;a&quot;&gt;hello&lt;/div&gt;",
  );
});
