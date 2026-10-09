/**
 * File-system routing over `Bun.FileSystemRouter` (Next.js `pages/` conventions).
 *
 * Bun resolves path -> file and extracts params/query; alfa adds no matcher of its own.
 * Convention files: `index.*`, `[param].*`, `[...catchall].*`, `[[...optionalCatchall]].*`.
 */

import type { HttpContext } from "../http/index";

export type MatchedRouteKind =
  | "exact"
  | "dynamic"
  | "catch-all"
  | "optional-catch-all";

export interface MatchedRoute {
  readonly filePath: string;
  readonly kind: MatchedRouteKind;
  readonly name: string;
  readonly params: Record<string, string>;
  readonly pathname: string;
  readonly query: Record<string, string>;
  readonly src: string;
}

export interface AppRouterOptions {
  dir: string;
  origin?: string;
  assetPrefix?: string;
}

export interface AppRouter {
  /** Absolute directory scanned for routes. */
  readonly dir: string;
  /** Map of route pattern -> file path, as reported by Bun. */
  readonly routes: Record<string, string>;
  match(input: string | Request | Response): MatchedRoute | null;
  reload(): void;
}

/** Create the router. `dir` is scanned by Bun's `FileSystemRouter`. */
export function createAppRouter(options: AppRouterOptions): AppRouter {
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: options.dir,
    origin: options.origin,
    assetPrefix: options.assetPrefix,
  });

  return {
    dir: options.dir,
    get routes(): Record<string, string> {
      return router.routes;
    },
    match: (input) => router.match(input) as MatchedRoute | null,
    reload: () => router.reload(),
  };
}

/** A route file's default export. */
export type RouteHandler = (
  ctx: HttpContext,
) => Response | string | Promise<Response | string>;

/** Import a route module and return its default export. */
export async function loadRouteHandler(
  filePath: string,
): Promise<RouteHandler | undefined> {
  const mod = (await import(filePath)) as { default?: RouteHandler };
  return mod.default;
}
