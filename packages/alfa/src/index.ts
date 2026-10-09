/**
 * alfa — minimal backend framework on Bun.
 *
 * Routing is file-system based (`pages/`), delegated to `Bun.FileSystemRouter`;
 * every other primitive is the Bun-native API. No custom matcher, no build step.
 */

import { resolve } from "node:path";
import { compose, type HttpContext, type Middleware } from "./http/index";
import {
  type AppRouter,
  createAppRouter,
  loadRouteHandler,
} from "./routing/index";

export interface DefineAppOptions {
  /** Directory scanned for routes. Default `./pages`. */
  dir?: string;
  /** Default port for `listen()`. Default 3000. */
  port?: number;
  /** Optional public assets directory, served at `/public/*`. */
  publicDir?: string;
  /** Passed through to `Bun.serve` (error pages / HMR). */
  development?: boolean;
  /**
   * Middlewares composed around every matched route, left to right.
   * Use for session, CSRF, logging, etc.
   */
  middleware?: Middleware[];
}

export interface App {
  readonly router: AppRouter;
  fetch(req: Request): Promise<Response>;
  /** Re-scan the pages directory (useful under `bun --hot`). */
  reload(): void;
  listen(port?: number): ReturnType<typeof Bun.serve>;
}

/**
 * Create an application. Routes resolve from files under `dir`:
 *
 *   pages/index.ts           -> /
 *   pages/blog/[slug].ts     -> /blog/:slug
 *   pages/api/users/[id].ts  -> /api/users/:id
 *   pages/docs/[[...slug]].ts-> /docs, /docs/a, /docs/a/b
 *
 * Each file `export default`s a handler `(ctx) => Response | string`.
 */
export function defineApp(options: DefineAppOptions = {}): App {
  const dir = resolve(process.cwd(), options.dir ?? "pages");
  const router = createAppRouter({ dir });
  const middlewares = options.middleware ?? [];

  const fetch = async (req: Request): Promise<Response> => {
    const match = router.match(req);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const handler = await loadRouteHandler(match.filePath);
    if (!handler) {
      return new Response("Route has no default export", { status: 500 });
    }

    const ctx: HttpContext = {
      req,
      params: match.params,
      query: match.query,
      cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
    };

    const invoke = async (): Promise<Response> => {
      const out = await handler(ctx);
      if (typeof out === "string") {
        return new Response(out, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return out;
    };

    if (middlewares.length === 0) {
      return invoke();
    }
    return compose(...middlewares)(ctx, invoke);
  };

  return {
    router,
    fetch,
    reload: () => router.reload(),
    listen: (port = options.port ?? 3000) =>
      Bun.serve({
        port,
        ...(options.development === undefined
          ? {}
          : { development: options.development }),
        ...(options.publicDir === undefined
          ? {}
          : {
              routes: {
                "/public/*": {
                  dir: resolve(process.cwd(), options.publicDir),
                },
              },
            }),
        fetch,
        error: (error) =>
          new Response(`Internal Server Error: ${String(error)}`, {
            status: 500,
          }),
      }),
  };
}

export * as auth from "./auth/index";
export * as console from "./console/index";
export * as database from "./database/index";
export * as http from "./http/index";
export * as routing from "./routing/index";
export * as session from "./session/index";
export * as validation from "./validation/index";
