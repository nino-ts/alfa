/**
 * Minimal HTML-escaping and string helpers. Bun-native, zero deps.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}

export function assert(
  value: unknown,
  message = "Assertion failed",
): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** JSON.stringify with a stable fallback for unsupported values. */
export function toJson(data: unknown, space?: number): string {
  return JSON.stringify(data ?? null, null, space);
}
