/**
 * Auth helpers: password hashing (Bun.password), bearer token verification
 * (Bun.CryptoHasher) and guard middleware.
 */

import type { HttpContext, Middleware } from "../http/index";
import type { SessionStore } from "../session/index";

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/** SHA-256 hex digest of a token, for at-rest comparison. */
export function hashToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

/** Constant-shape comparison: both sides hashed, then compared. */
export function verifyToken(token: string, expectedHash: string): boolean {
  return hashToken(token) === expectedHash;
}

export type GuardName = "session" | "bearer";

export interface GuardOptions {
  /** For bearer: list of accepted token hashes (hashToken output). */
  tokenHashes?: readonly string[];
  /** For bearer: custom verifier, overrides tokenHashes. */
  verify?: (token: string) => boolean | Promise<boolean>;
  /** For session: session key holding the user id. Default "userId". */
  sessionKey?: string;
  /** Key on ctx where the authenticated subject is stored. Default "user". */
  contextKey?: string;
}

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function guard(name: GuardName, options: GuardOptions = {}): Middleware {
  const contextKey = options.contextKey ?? "user";

  if (name === "session") {
    const key = options.sessionKey ?? "userId";
    return async (ctx: HttpContext, next) => {
      const session = ctx.session as SessionStore | undefined;
      const userId = session?.get(key);
      if (userId === undefined || userId === null) {
        return unauthorized("Authentication required");
      }
      ctx[contextKey] = userId;
      return next(ctx);
    };
  }

  return async (ctx, next) => {
    const header = ctx.req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : "";
    if (!token) return unauthorized("Missing bearer token");

    let ok = false;
    if (options.verify) {
      ok = await options.verify(token);
    } else if (options.tokenHashes) {
      const hashed = hashToken(token);
      ok = options.tokenHashes.includes(hashed);
    }

    if (!ok) return unauthorized("Invalid token");
    ctx[contextKey] = token;
    return next(ctx);
  };
}
