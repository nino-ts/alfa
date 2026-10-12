/**
 * Query builder over Bun.SQL (Drizzle-like) plus an Eloquent-like schema
 * blueprint that can generate the table DDL. No external ORM.
 */

import { resolve } from "node:path";
import { Glob, type SQL } from "bun";

// ---------------------------------------------------------------------------
// Dialect and schema
// ---------------------------------------------------------------------------

export type Dialect = "sqlite" | "postgres" | "mysql";

export type ColumnType =
  | "id"
  | "uuid"
  | "string"
  | "text"
  | "integer"
  | "bigInteger"
  | "boolean"
  | "date"
  | "dateTime"
  | "timestamp"
  | "json";

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable: boolean;
  unique: boolean;
  primary: boolean;
  autoIncrement: boolean;
  /** Only used by `string` on MySQL (`VARCHAR(n)`). */
  length?: number;
  defaultValue?: string | number | boolean | null;
}

/** Chainable column modifiers, in the spirit of Eloquent's Blueprint. */
export interface ColumnBuilder {
  nullable(): ColumnBuilder;
  unique(): ColumnBuilder;
  default(value: string | number | boolean | null): ColumnBuilder;
  primary(): ColumnBuilder;
}

export interface TableBlueprint {
  id(name?: string): ColumnBuilder;
  uuid(name?: string): ColumnBuilder;
  string(name: string, length?: number): ColumnBuilder;
  text(name: string): ColumnBuilder;
  integer(name: string): ColumnBuilder;
  bigInteger(name: string): ColumnBuilder;
  boolean(name: string): ColumnBuilder;
  date(name: string): ColumnBuilder;
  dateTime(name: string): ColumnBuilder;
  timestamp(name: string): ColumnBuilder;
  json(name: string): ColumnBuilder;
  /** Adds `createdAt` and `updatedAt`. */
  timestamps(): void;
}

export type Row = Record<string, unknown>;

export interface WhereClause {
  column: string;
  value: unknown;
}

export function eq(column: string, value: unknown): WhereClause {
  return { column, value };
}

function dialectOf(db: SQL): Dialect {
  const adapter = (db as { options?: { adapter?: unknown } }).options?.adapter;
  if (adapter === "sqlite" || adapter === "postgres" || adapter === "mysql") {
    return adapter;
  }
  throw new Error(`Unsupported SQL adapter: ${String(adapter)}`);
}

function quoteIdent(dialect: Dialect, name: string): string {
  const quote = dialect === "mysql" ? "`" : '"';
  return `${quote}${name.replaceAll(quote, quote + quote)}${quote}`;
}

const TYPE_SQL: Record<Dialect, Record<ColumnType, string>> = {
  sqlite: {
    id: "INTEGER",
    uuid: "TEXT",
    string: "TEXT",
    text: "TEXT",
    integer: "INTEGER",
    bigInteger: "INTEGER",
    boolean: "INTEGER",
    date: "TEXT",
    dateTime: "TEXT",
    timestamp: "TEXT",
    json: "TEXT",
  },
  postgres: {
    id: "SERIAL",
    uuid: "UUID",
    string: "TEXT",
    text: "TEXT",
    integer: "INTEGER",
    bigInteger: "BIGINT",
    boolean: "BOOLEAN",
    date: "DATE",
    dateTime: "TIMESTAMPTZ",
    timestamp: "TIMESTAMPTZ",
    json: "JSONB",
  },
  mysql: {
    id: "INT",
    uuid: "CHAR(36)",
    string: "VARCHAR",
    text: "TEXT",
    integer: "INT",
    bigInteger: "BIGINT",
    boolean: "TINYINT(1)",
    date: "DATE",
    dateTime: "DATETIME",
    timestamp: "TIMESTAMP",
    json: "JSON",
  },
};

function defaultSQL(
  dialect: Dialect,
  value: string | number | boolean | null,
): string {
  if (value === null) return "NULL";
  if (typeof value === "boolean") {
    if (dialect === "postgres") return value ? "true" : "false";
    return value ? "1" : "0";
  }
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

function columnSQL(dialect: Dialect, def: ColumnDefinition): string {
  const ident = quoteIdent(dialect, def.name);

  if (def.type === "id" && def.autoIncrement) {
    if (dialect === "sqlite")
      return `${ident} INTEGER PRIMARY KEY AUTOINCREMENT`;
    if (dialect === "postgres") return `${ident} SERIAL PRIMARY KEY`;
    return `${ident} INT AUTO_INCREMENT`;
  }

  const base = TYPE_SQL[dialect][def.type];
  const type =
    def.type === "string" && def.length !== undefined && dialect === "mysql"
      ? `${base}(${def.length})`
      : base;

  const parts = [ident, type];
  if (def.primary) parts.push("PRIMARY KEY");
  else if (!def.nullable) parts.push("NOT NULL");
  if (def.unique) parts.push("UNIQUE");
  if (def.defaultValue !== undefined) {
    parts.push(`DEFAULT ${defaultSQL(dialect, def.defaultValue)}`);
  }
  return parts.join(" ");
}

/** `CREATE TABLE IF NOT EXISTS` for the given blueprint columns. */
export function createTableSQL(
  dialect: Dialect,
  name: string,
  columns: readonly ColumnDefinition[],
): string {
  if (columns.length === 0) {
    throw new Error(`Table ${name} defines no columns`);
  }
  const parts = columns.map((column) => columnSQL(dialect, column));
  const auto = columns.find(
    (column) => column.type === "id" && column.autoIncrement,
  );
  if (dialect === "mysql" && auto) {
    parts.push(`PRIMARY KEY (${quoteIdent(dialect, auto.name)})`);
  }
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(dialect, name)} (${parts.join(", ")})`;
}

export function dropTableSQL(dialect: Dialect, name: string): string {
  return `DROP TABLE IF EXISTS ${quoteIdent(dialect, name)}`;
}

function column(
  sink: ColumnDefinition[],
  def: ColumnDefinition,
): ColumnBuilder {
  sink.push(def);
  const builder: ColumnBuilder = {
    nullable: () => {
      def.nullable = true;
      return builder;
    },
    unique: () => {
      def.unique = true;
      return builder;
    },
    default: (value) => {
      def.defaultValue = value;
      return builder;
    },
    primary: () => {
      def.primary = true;
      return builder;
    },
  };
  return builder;
}

function plain(
  sink: ColumnDefinition[],
  name: string,
  type: ColumnType,
  length?: number,
): ColumnBuilder {
  return column(sink, {
    name,
    type,
    nullable: false,
    unique: false,
    primary: false,
    autoIncrement: false,
    ...(length === undefined ? {} : { length }),
  });
}

function createBlueprint(sink: ColumnDefinition[]): TableBlueprint {
  return {
    id: (name = "id") =>
      column(sink, {
        name,
        type: "id",
        nullable: false,
        unique: false,
        primary: true,
        autoIncrement: true,
      }),
    uuid: (name = "uuid") => plain(sink, name, "uuid"),
    string: (name, length = 255) => plain(sink, name, "string", length),
    text: (name) => plain(sink, name, "text"),
    integer: (name) => plain(sink, name, "integer"),
    bigInteger: (name) => plain(sink, name, "bigInteger"),
    boolean: (name) => plain(sink, name, "boolean"),
    date: (name) => plain(sink, name, "date"),
    dateTime: (name) => plain(sink, name, "dateTime"),
    timestamp: (name) => plain(sink, name, "timestamp"),
    json: (name) => plain(sink, name, "json"),
    timestamps: () => {
      // Nullable, like Eloquent's $table->timestamps() — inserts work without them.
      plain(sink, "createdAt", "timestamp").nullable();
      plain(sink, "updatedAt", "timestamp").nullable();
    },
  };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildWhere(
  dialect: Dialect,
  clauses: ReadonlyArray<WhereClause>,
  offset: number,
): { sql: string; values: unknown[] } {
  if (clauses.length === 0) return { sql: "", values: [] };
  const values: unknown[] = [];
  const parts = clauses.map((clause) => {
    values.push(clause.value);
    return `${quoteIdent(dialect, clause.column)} = $${offset + values.length - 1}`;
  });
  return { sql: ` WHERE ${parts.join(" AND ")}`, values };
}

export class SelectBuilder<TRow extends object> {
  private clauses: WhereClause[] = [];
  private take?: number;

  constructor(
    private readonly db: SQL,
    private readonly table: string,
    private readonly columns: string,
  ) {}

  where(...clauses: WhereClause[]): this {
    this.clauses.push(...clauses);
    return this;
  }

  limit(n: number): this {
    this.take = n;
    return this;
  }

  async get(): Promise<TRow[]> {
    const dialect = dialectOf(this.db);
    const where = buildWhere(dialect, this.clauses, 1);
    const limitSql =
      this.take === undefined
        ? ""
        : ` LIMIT ${Math.max(0, Math.floor(this.take))}`;
    return this.db.unsafe<TRow[]>(
      `SELECT ${this.columns} FROM ${quoteIdent(dialect, this.table)}${where.sql}${limitSql}`,
      where.values,
    );
  }

  async first(): Promise<TRow | undefined> {
    this.limit(1);
    const rows = await this.get();
    return rows[0];
  }
}

export class UpdateBuilder<TRow extends object> {
  private clauses: WhereClause[] = [];

  constructor(
    private readonly db: SQL,
    private readonly table: string,
    private readonly patch: Row,
  ) {}

  where(...clauses: WhereClause[]): this {
    this.clauses.push(...clauses);
    return this;
  }

  async exec(): Promise<TRow[]> {
    const dialect = dialectOf(this.db);
    const entries = Object.entries(this.patch);
    if (entries.length === 0) return [];
    const setSql = entries
      .map(([key], i) => `${quoteIdent(dialect, key)} = $${i + 1}`)
      .join(", ");
    const setValues = entries.map(([, value]) => value);
    const where = buildWhere(dialect, this.clauses, entries.length + 1);
    return this.db.unsafe<TRow[]>(
      `UPDATE ${quoteIdent(dialect, this.table)} SET ${setSql}${where.sql} RETURNING *`,
      [...setValues, ...where.values],
    );
  }

  /** Update and return the first affected row. */
  async first(): Promise<TRow | undefined> {
    const rows = await this.exec();
    return rows[0];
  }
}

export class DeleteBuilder<TRow extends object> {
  private clauses: WhereClause[] = [];

  constructor(
    private readonly db: SQL,
    private readonly table: string,
  ) {}

  where(...clauses: WhereClause[]): this {
    this.clauses.push(...clauses);
    return this;
  }

  async exec(): Promise<TRow[]> {
    const dialect = dialectOf(this.db);
    const where = buildWhere(dialect, this.clauses, 1);
    return this.db.unsafe<TRow[]>(
      `DELETE FROM ${quoteIdent(dialect, this.table)}${where.sql} RETURNING *`,
      where.values,
    );
  }

  async first(): Promise<TRow | undefined> {
    const rows = await this.exec();
    return rows[0];
  }
}

// ---------------------------------------------------------------------------
// defineTable
// ---------------------------------------------------------------------------

export interface Table<TRow extends object> {
  readonly name: string;
  readonly db: SQL;
  readonly dialect: Dialect;
  /** Columns collected from the blueprint. */
  readonly columns: readonly ColumnDefinition[];
  /** Raw tagged-template passthrough over Bun.SQL. */
  readonly raw: SQL;
  select(columns?: string | string[]): SelectBuilder<TRow>;
  insert(values: Partial<TRow> | Array<Partial<TRow>>): Promise<TRow[]>;
  update(patch: Row): UpdateBuilder<TRow>;
  delete(): DeleteBuilder<TRow>;
  /** `CREATE TABLE IF NOT EXISTS` from the blueprint. */
  createTable(): Promise<void>;
  dropTable(): Promise<void>;
}

/** Define a table from an Eloquent-style blueprint. */
export function defineTable<TRow extends object = Row>(
  db: SQL,
  name: string,
  blueprint: (table: TableBlueprint) => void,
): Table<TRow> {
  const columns: ColumnDefinition[] = [];
  blueprint(createBlueprint(columns));
  const dialect = dialectOf(db);
  const create = createTableSQL(dialect, name, columns);
  const drop = dropTableSQL(dialect, name);

  const columnsFor = (selected?: string | string[]): string => {
    if (selected === undefined) return "*";
    const list = Array.isArray(selected) ? selected : [selected];
    return list.map((column) => quoteIdent(dialect, column)).join(", ");
  };

  return {
    name,
    db,
    dialect,
    columns,
    raw: db,
    select: (selected) =>
      new SelectBuilder<TRow>(db, name, columnsFor(selected)),
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
      const flat = rows.flatMap((row) =>
        keys.map((key) => (row as Record<string, unknown>)[key]),
      );
      return db.unsafe<TRow[]>(
        `INSERT INTO ${quoteIdent(dialect, name)} (${keys.map((key) => quoteIdent(dialect, key)).join(", ")}) VALUES ${valuesSql} RETURNING *`,
        flat,
      );
    },
    update: (patch) => new UpdateBuilder<TRow>(db, name, patch),
    delete: () => new DeleteBuilder<TRow>(db, name),
    createTable: async () => {
      await db.unsafe(create, []);
    },
    dropTable: async () => {
      await db.unsafe(drop, []);
    },
  };
}

// ---------------------------------------------------------------------------
// Migrations (TypeScript)
// ---------------------------------------------------------------------------

export interface Migration {
  up(db: SQL): Promise<void>;
  down?(db: SQL): Promise<void>;
}

/**
 * Applies every `*.ts` file under `dir` (default `database/migrations`) in
 * filename order, each in its own transaction. Returns the applied names.
 */
export async function migrate(
  db: SQL,
  dir = "database/migrations",
): Promise<string[]> {
  const files: string[] = [];
  for await (const file of new Glob("*.ts").scan({ cwd: dir })) {
    files.push(file);
  }
  files.sort();

  const applied: string[] = [];
  for (const file of files) {
    const mod = (await import(resolve(dir, file))) as { default?: Migration };
    const migration = mod.default;
    if (!migration) {
      throw new Error(`Migration ${file} has no default export`);
    }
    await db.begin(async (tx) => {
      await migration.up(tx);
    });
    applied.push(file);
  }
  return applied;
}
