import { describe, expect, test } from "bun:test";
import {
  parse,
  parseBody,
  type StandardSchemaV1,
  ValidationError,
} from "#alfa/validation";

const schema: StandardSchemaV1<{ name: string; age?: number }> = {
  "~standard": {
    version: 1,
    validate(value) {
      if (
        value &&
        typeof value === "object" &&
        typeof (value as Record<string, unknown>).name === "string"
      ) {
        return { value: value as { name: string } };
      }
      return { issues: [{ message: "name must be a string" }] };
    },
  },
};

describe("validation parse", () => {
  test("returns parsed value on success", async () => {
    const out = await parse(schema, { name: "Ana" });
    expect(out.name).toBe("Ana");
  });

  test("throws ValidationError with issues on failure", async () => {
    try {
      await parse(schema, { name: 123 });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).issues[0]?.message).toBe(
        "name must be a string",
      );
    }
  });

  test("supports async validate", async () => {
    const asyncSchema: StandardSchemaV1<number> = {
      "~standard": {
        version: 1,
        async validate(v) {
          return typeof v === "number"
            ? { value: v }
            : { issues: [{ message: "not a number" }] };
        },
      },
    };
    expect(await parse(asyncSchema, 5)).toBe(5);
    await expect(parse(asyncSchema, "x")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("validation parseBody", () => {
  test("parses JSON request body", async () => {
    const req = new Request("http://x/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Bob" }),
    });
    expect((await parseBody(schema, { req })).name).toBe("Bob");
  });

  test("rejects invalid JSON", async () => {
    const req = new Request("http://x/", { method: "POST", body: "not-json{" });
    await expect(parseBody(schema, { req })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
