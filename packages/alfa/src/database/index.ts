/**
 * Tiny Drizzle-like query builder over Bun.SQL. No external ORM.
 */

import { Glob, type SQL } from "bun";

export type ColumnType = "string" | "number" | "boolean" | "date" | "json";
export type TableDefinition = {
  name: string;
  columns: Record<string, ColumnType>;
};
export type Row = Record<string, unknown>;

export interface WhereClause {
  /** SQL fragment without the leading WHERE, e.g. `"id" = $1`. */
  fragment: string;
  values: unknown[];
  /** Index offset at which this clause's placeholders start (1-based). */
  offset: number;
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

/** Equality predicate. */
export function eq(
  column: string,
  value: unknown,
): Omit<WhereClause, "offset"> {
  return { fragment: `${quoteIdent(column)} = $?`, values: [value] };
}

function buildWhere(
  clauses: ReadonlyArray<Omit<WhereClause, "offset">>,
  offset: number,
): { sql: string; values: unknown[] } {
  if (clauses.length === 0) return { sql: "", values: [] };
  const values: unknown[] = [];
  const parts = clauses.map((clause) => {
    let fragment = clause.fragment;
    for (const value of clause.values) {
      values.push(value);
      fragment = fragment.replace("$?", `$${offset + values.length - 1}`);
    }
    return fragment;
  });
  return { sql: ` WHERE ${parts.join(" AND ")}`, values };
}

export class SelectBuilder<TRow extends Row> {
  private clauses: Array<Omit<WhereClause, "offset">> = [];
  private take?: number;

  constructor(
    private readonly db: SQL,
    private readonly table: string,
    private readonly columns: string,
  ) {}

  where(...clauses: Array<Omit<WhereClause, "offset">>): this {
    this.clauses.push(...clauses);
    return this;
  }

  limit(n: number): this {
    this.take = n;
    return this;
  }

  async get(): Promise<TRow[]> {
    const where = buildWhere(this.clauses, 1);
    const limitSql =
      this.take === undefined
        ? ""
        : ` LIMIT ${Math.max(0, Math.floor(this.take))}`;
    return this.db.unsafe<TRow[]>(
      `SELECT ${this.columns} FROM ${quoteIdent(this.table)}${where.sql}${limitSql}`,
      where.values,
    );
  }

  async first(): Promise<TRow | undefined> {
    this.limit(1);
    const rows = await this.get();
    return rows[0];
  }
}

export class UpdateBuilder<TRow extends Row> {
  private clauses: Array<Omit<WhereClause, "offset">> = [];

  constructor(
    private readonly db: SQL,
    private readonly table: string,
    private readonly patch: Row,
  ) {}

  where(...clauses: Array<Omit<WhereClause, "offset">>): this {
    this.clauses.push(...clauses);
    return this;
  }

  async exec(): Promise<TRow[]> {
    const entries = Object.entries(this.patch);
    if (entries.length === 0) return [];
    const setSql = entries
      .map(([key], i) => `${quoteIdent(key)} = $${i + 1}`)
      .join(", ");
    const setValues = entries.map(([, value]) => value);
    const where = buildWhere(this.clauses, entries.length + 1);
    return this.db.unsafe<TRow[]>(
      `UPDATE ${quoteIdent(this.table)} SET ${setSql}${where.sql} RETURNING *`,
      [...setValues, ...where.values],
    );
  }

  /** Update and return the first affected row. */
  async first(): Promise<TRow | undefined> {
    const rows = await this.exec();
    return rows[0];
  }
}

export class DeleteBuilder<TRow extends Row> {
  private clauses: Array<Omit<WhereClause, "offset">> = [];

  constructor(
    private readonly db: SQL,
    private readonly table: string,
  ) {}

  where(...clauses: Array<Omit<WhereClause, "offset">>): this {
    this.clauses.push(...clauses);
    return this;
  }

  async exec(): Promise<TRow[]> {
    const where = buildWhere(this.clauses, 1);
    return this.db.unsafe<TRow[]>(
      `DELETE FROM ${quoteIdent(this.table)}${where.sql} RETURNING *`,
      where.values,
    );
  }

  async first(): Promise<TRow | undefined> {
    const rows = await this.exec();
    return rows[0];
  }
}

export interface Table<TRow extends Row> {
  readonly name: string;
  readonly db: SQL;
  /** Raw tagged-template passthrough over Bun.SQL. */
  readonly raw: SQL;
  select(columns?: string | string[]): SelectBuilder<TRow>;
  insert(values: Row | Row[]): Promise<TRow[]>;
  update(patch: Row): UpdateBuilder<TRow>;
  delete(): DeleteBuilder<TRow>;
}

export function defineTable<TRow extends Row = Row>(
  db: SQL,
  definition: TableDefinition,
): Table<TRow> {
  const columnsFor = (columns?: string | string[]): string => {
    if (columns === undefined) return "*";
    const list = Array.isArray(columns) ? columns : [columns];
    return list.map(quoteIdent).join(", ");
  };

  return {
    name: definition.name,
    db,
    raw: db,
    select: (columns) =>
      new SelectBuilder<TRow>(db, definition.name, columnsFor(columns)),
    insert: async (values) => {
      const rows = Array.isArray(values) ? values : [values];
      if (rows.length === 0) return [];
      const keys = Object.keys(rows[0] ?? {});
      const valuesSql = rows
        .map(
          (_, rowIndex) =>
            `(${keys.map((_, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`).join(", ")})`,
        )
        .join(", ");
      const flat = rows.flatMap((row) => keys.map((key) => row[key]));
      return db.unsafe<TRow[]>(
        `INSERT INTO ${quoteIdent(definition.name)} (${keys.map(quoteIdent).join(", ")}) VALUES ${valuesSql} RETURNING *`,
        flat,
      );
    },
    update: (patch) => new UpdateBuilder<TRow>(db, definition.name, patch),
    delete: () => new DeleteBuilder<TRow>(db, definition.name),
  };
}

/**
 * Migration stub: executes every `*.sql` file under `dir` (default
 * `database/migrations`) in filename order. Returns applied file names.
 */
export async function migrate(
  db: SQL,
  dir = "database/migrations",
): Promise<string[]> {
  const files: string[] = [];
  for await (const file of new Glob("*.sql").scan({ cwd: dir })) {
    files.push(file);
  }
  files.sort();
  const applied: string[] = [];
  for (const file of files) {
    const sqlText = await Bun.file(`${dir}/${file}`).text();
    await db.begin(async (tx) => {
      await tx.unsafe(sqlText, []);
    });
    applied.push(file);
  }
  return applied;
}
