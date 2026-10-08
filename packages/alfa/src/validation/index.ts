/**
 * StandardSchemaV1 adapter. `parse` validates unknown input and returns the
 * parsed output or throws `ValidationError`. No external deps.
 */

export interface StandardSchemaIssue {
  message: string;
  path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
}

export interface StandardSchemaSuccess<TOutput> {
  value: TOutput;
  issues?: undefined;
}

export interface StandardSchemaFailure {
  issues: ReadonlyArray<StandardSchemaIssue>;
  value?: undefined;
}

export type StandardSchemaResult<TOutput> =
  | StandardSchemaSuccess<TOutput>
  | StandardSchemaFailure;

/** Structural mirror of the Standard Schema V1 interface. */
export interface StandardSchemaV1<TOutput = unknown, TInput = unknown> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor?: string;
    validate(
      value: TInput,
    ): StandardSchemaResult<TOutput> | Promise<StandardSchemaResult<TOutput>>;
  };
}

export type InferOutput<Schema> =
  Schema extends StandardSchemaV1<infer TOutput, unknown> ? TOutput : never;

export class ValidationError extends Error {
  readonly issues: ReadonlyArray<StandardSchemaIssue>;

  constructor(issues: ReadonlyArray<StandardSchemaIssue>) {
    super(
      issues.map((issue) => issue.message).join("; ") || "Validation failed",
    );
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export async function parse<Schema extends StandardSchemaV1>(
  schema: Schema,
  data: unknown,
): Promise<InferOutput<Schema>> {
  const result = await schema["~standard"].validate(data);
  if (result.issues) {
    throw new ValidationError(result.issues);
  }
  return result.value as InferOutput<Schema>;
}

/** Validate the JSON body of the current HttpContext. */
export async function parseBody<Schema extends StandardSchemaV1>(
  schema: Schema,
  ctx: { req: Request },
): Promise<InferOutput<Schema>> {
  let body: unknown;
  try {
    body = await ctx.req.json();
  } catch {
    throw new ValidationError([{ message: "Request body must be valid JSON" }]);
  }
  return parse(schema, body);
}
