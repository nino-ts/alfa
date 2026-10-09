/**
 * HTTP primitives: context, middleware composition, response helpers,
 * CSRF protection (Bun.CSRF) and cookie handling (Bun.CookieMap / Bun.Cookie).
 */

export interface HttpContext {
  readonly req: Request;
  /** Path params extracted by the router (`/users/:id` → ctx.params.id). */
  params: Record<string, string>;
  /** Query-string values (`?page=2` → ctx.query.page). */
  query: Record<string, string>;
  /** Parsed request cookies. */
  cookies: Bun.CookieMap;
  /** Middleware-extensible bag (session, user, csrfToken, ...). */
  [key: string]: unknown;
}

export type Next = (ctx: HttpContext) => Response | Promise<Response>;
export type Middleware = (
  ctx: HttpContext,
  next: Next,
) => Response | Promise<Response>;
export type Handler = (ctx: HttpContext) => Response | Promise<Response>;

/** Compose middlewares, left to right. */
export function compose(...middlewares: Middleware[]): Middleware {
  return (ctx, next) => {
    let index = -1;
    const dispatch = (i: number): Response | Promise<Response> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      const layer = middlewares[i];
      if (!layer) return next(ctx);
      return layer(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = copyHeaders(init.headers);
  if (!headers.has("content-type"))
    headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function text(body: string, init: ResponseInit = {}): Response {
  const headers = copyHeaders(init.headers);
  if (!headers.has("content-type"))
    headers.set("content-type", "text/plain; charset=utf-8");
  return new Response(body, { ...init, headers });
}

function copyHeaders(init: ResponseInit["headers"]): Headers {
  const headers = new Headers();
  if (!init) return headers;
  new Headers(init as ConstructorParameters<typeof Headers>[0]).forEach(
    (value, key) => {
      headers.set(key, value);
    },
  );
  return headers;
}

export function redirect(url: string, status = 302): Response {
  return new Response(null, { status, headers: { location: url } });
}

/** Attach a Set-Cookie header to a response (does not mutate the original). */
export function withCookie(response: Response, cookie: Bun.Cookie): Response {
  const headers = new Headers(response.headers);
  headers.append("set-cookie", cookie.serialize());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function getCookie(ctx: HttpContext, name: string): string | undefined {
  return ctx.cookies.get(name) ?? undefined;
}

export interface CsrfOptions {
  /** Secret passed to Bun.CSRF.generate/verify. */
  secret: string;
  /** Header checked on mutating requests. Default `x-csrf-token`. */
  header?: string;
  /** Token TTL in ms. Default 24h (Bun default). */
  expiresIn?: number;
  /** Optional principal binding (session id, user id). */
  sessionId?: (ctx: HttpContext) => string | undefined;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF middleware. Safe methods generate `ctx.csrfToken`; mutating methods
 * must send a valid token in the configured header, otherwise 403.
 */
export function csrf(options: CsrfOptions): Middleware {
  const headerName = options.header ?? "x-csrf-token";
  return async (ctx, next) => {
    const sessionId = options.sessionId?.(ctx);
    if (SAFE_METHODS.has(ctx.req.method.toUpperCase())) {
      ctx.csrfToken = Bun.CSRF.generate(options.secret, {
        sessionId,
        expiresIn: options.expiresIn,
      });
      return next(ctx);
    }
    const token = ctx.req.headers.get(headerName) ?? "";
    const valid =
      token.length > 0 &&
      Bun.CSRF.verify(token, {
        secret: options.secret,
        sessionId,
        maxAge: options.expiresIn,
      });
    if (!valid) {
      return text("Invalid CSRF token", { status: 403 });
    }
    return next(ctx);
  };
}
