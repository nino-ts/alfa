/**
 * Session middlewares: encrypted-ish cookie sessions (HMAC via
 * Bun.CryptoHasher) and Redis-backed sessions (Bun.RedisClient).
 * Each returns the middleware plus get/set/destroy helpers bound to the
 * request context.
 */

import { RedisClient } from "bun";
import type { HttpContext, Middleware } from "../http/index";

export interface SessionStore {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  destroy(): Promise<void>;
  /** Current serializable snapshot. */
  all(): Record<string, unknown>;
}

export interface SessionHelpers {
  get<T = unknown>(ctx: HttpContext, key: string): T | undefined;
  set(ctx: HttpContext, key: string, value: unknown): void;
  destroy(ctx: HttpContext): Promise<void>;
}

export interface SessionBundle {
  middleware: Middleware;
  get: SessionHelpers["get"];
  set: SessionHelpers["set"];
  destroy: SessionHelpers["destroy"];
}

function getStore(ctx: HttpContext): SessionStore | undefined {
  const candidate = ctx.session;
  if (candidate && typeof candidate === "object")
    return candidate as SessionStore;
  return undefined;
}

const helpers: SessionHelpers = {
  get: <T = unknown>(ctx: HttpContext, key: string): T | undefined =>
    getStore(ctx)?.get<T>(key),
  set: (ctx, key, value) => getStore(ctx)?.set(key, value),
  destroy: async (ctx) => {
    await getStore(ctx)?.destroy();
  },
};

function hmac(secret: string, payload: string): string {
  return new Bun.CryptoHasher("sha256", secret).update(payload).digest("hex");
}

function encodePayload(secret: string, data: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}

function decodePayload(
  secret: string,
  token: string,
): Record<string, unknown> | undefined {
  const [body, signature] = token.split(".");
  if (!body || !signature) return undefined;
  if (hmac(secret, body) !== signature) return undefined;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    );
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export interface CookieSessionOptions {
  name?: string;
  secret: string;
  /** Cookie Max-Age in seconds. */
  maxAge?: number;
  secure?: boolean;
}

export function cookieSession(options: CookieSessionOptions): SessionBundle {
  const name = options.name ?? "alfa_session";

  const middleware: Middleware = async (ctx, next) => {
    const token = ctx.cookies.get(name);
    const data = token ? (decodePayload(options.secret, token) ?? {}) : {};
    const store: SessionStore = {
      get: <T = unknown>(key: string) => data[key] as T | undefined,
      set: (key, value) => {
        data[key] = value;
      },
      destroy: async () => {
        for (const key of Object.keys(data)) delete data[key];
        data.__destroyed = true;
      },
      all: () => ({ ...data }),
    };
    ctx.session = store;

    const response = await next(ctx);

    const headers = new Headers(response.headers);
    const destroyed = data.__destroyed === true;
    if (destroyed) delete data.__destroyed;
    const cookie = new Bun.Cookie(
      name,
      destroyed ? "" : encodePayload(options.secret, data),
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: options.secure ?? false,
        maxAge: destroyed ? 0 : (options.maxAge ?? 60 * 60 * 24 * 7),
      },
    );
    headers.append("set-cookie", cookie.toString());
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  return { middleware, ...helpers };
}

export interface RedisSessionOptions {
  url?: string;
  prefix?: string;
  /** TTL in seconds. Default 7 days. */
  ttl?: number;
  name?: string;
  /** Optional pre-built client (useful for tests). */
  client?: RedisClient;
}

export function redisSession(options: RedisSessionOptions = {}): SessionBundle {
  const name = options.name ?? "alfa_session";
  const prefix = options.prefix ?? "alfa:sess:";
  const ttl = options.ttl ?? 60 * 60 * 24 * 7;
  const client = options.client ?? new RedisClient(options.url);

  const middleware: Middleware = async (ctx, next) => {
    let id = ctx.cookies.get(name);
    let data: Record<string, unknown> = {};

    if (id) {
      const raw = await client.get(`${prefix}${id}`);
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            data = parsed as Record<string, unknown>;
          }
        } catch {
          data = {};
        }
      } else {
        id = "";
      }
    }

    if (!id) id = crypto.randomUUID();

    let destroyed = false;
    const store: SessionStore = {
      get: <T = unknown>(key: string) => data[key] as T | undefined,
      set: (key, value) => {
        data[key] = value;
      },
      destroy: async () => {
        destroyed = true;
        await client.del(`${prefix}${id}`);
      },
      all: () => ({ ...data }),
    };
    ctx.session = store;

    const response = await next(ctx);

    const headers = new Headers(response.headers);
    if (destroyed) {
      const cookie = new Bun.Cookie(name, "", { path: "/", maxAge: 0 });
      headers.append("set-cookie", cookie.toString());
    } else {
      await client.set(`${prefix}${id}`, JSON.stringify(data), "EX", ttl);
      const cookie = new Bun.Cookie(name, id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: ttl,
      });
      headers.append("set-cookie", cookie.toString());
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  return { middleware, ...helpers };
}
