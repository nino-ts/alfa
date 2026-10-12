import { describe, expect, test } from "bun:test";
import type { SQL } from "bun";
import { defineTable, eq } from "#alfa/database";

function mockDb(rows: unknown[] = []) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const db = {
    options: { adapter: "sqlite" },
    unsafe: async (sql: string, values: unknown[]) => {
      calls.push({ sql, values });
      return rows;
    },
    begin: async (
      fn: (tx: {
        unsafe: (s: string, v: unknown[]) => Promise<unknown[]>;
      }) => Promise<void>,
    ) => fn({ unsafe: async () => [] }),
    close: async () => {},
  };
  return { db: db as unknown as SQL, calls };
}

function users(db: SQL) {
  return defineTable(db, "users", (t) => {
    t.id();
    t.string("name");
  });
}

describe("database query builder", () => {
  test("select with where and limit", async () => {
    const { db, calls } = mockDb([{ id: 1 }]);
    await users(db).select(["id", "name"]).where(eq("id", 1)).limit(5).get();
    expect(calls[0]?.sql).toBe(
      'SELECT "id", "name" FROM "users" WHERE "id" = $1 LIMIT 5',
    );
    expect(calls[0]?.values).toEqual([1]);
  });

  test("select * without where", async () => {
    const { db, calls } = mockDb();
    await users(db).select().get();
    expect(calls[0]?.sql).toBe('SELECT * FROM "users"');
    expect(calls[0]?.values).toEqual([]);
  });

  test("first() applies limit 1", async () => {
    const { db, calls } = mockDb([{ id: 2 }]);
    const row = await users(db).select().where(eq("id", 2)).first();
    expect(row).toEqual({ id: 2 });
    expect(calls[0]?.sql).toContain("LIMIT 1");
  });

  test("insert builds values placeholders", async () => {
    const { db, calls } = mockDb();
    await users(db).insert([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
    expect(calls[0]?.sql).toBe(
      'INSERT INTO "users" ("id", "name") VALUES ($1, $2), ($3, $4) RETURNING *',
    );
    expect(calls[0]?.values).toEqual([1, "a", 2, "b"]);
  });

  test("update offsets where placeholders after set values", async () => {
    const { db, calls } = mockDb();
    await users(db).update({ name: "x" }).where(eq("id", 9)).exec();
    expect(calls[0]?.sql).toBe(
      'UPDATE "users" SET "name" = $1 WHERE "id" = $2 RETURNING *',
    );
    expect(calls[0]?.values).toEqual(["x", 9]);
  });

  test("delete builds where", async () => {
    const { db, calls } = mockDb();
    await users(db).delete().where(eq("id", 3)).exec();
    expect(calls[0]?.sql).toBe(
      'DELETE FROM "users" WHERE "id" = $1 RETURNING *',
    );
    expect(calls[0]?.values).toEqual([3]);
  });

  test("eq carries an unquoted column and a value", () => {
    expect(eq('weird"col', 1)).toEqual({ column: 'weird"col', value: 1 });
  });
});
