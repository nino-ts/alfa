/**
 * Minimal router. Supports path params (`/users/:id`), named routes and a
 * type-safe `route()` helper. Named routes are stored in a global registry;
 * augment `RouteRegistryPaths` via declaration merging for full type-safety.
 */

import type { Handler, HttpContext } from "../http/index";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: Handler;
  name?: string;
}

/** Augment this interface to make route names/params type-safe. */
export interface RouteRegistryPaths {
  // augment via declaration merging, e.g.: home: "/";
}

export type RouteName = keyof RouteRegistryPaths extends never
  ? string
  : keyof RouteRegistryPaths & string;

type ParamsOf<Path extends string> =
  Path extends `${string}:${infer Name}/${infer Rest}`
    ? Name | ParamsOf<Rest>
    : Path extends `${string}:${infer Name}`
      ? Name
      : never;

export type RouteParamsFor<Name extends RouteName> = RouteName extends string
  ? Name extends keyof RouteRegistryPaths
    ? RouteRegistryPaths[Name] extends infer Path extends string
      ? [ParamsOf<Path>] extends [never]
        ? Record<string, never> | undefined
        : { [Key in ParamsOf<Path>]: string | number }
      : Record<string, string | number>
    : Record<string, string | number> | undefined
  : Record<string, string | number> | undefined;

const namedRoutes = new Map<string, { path: string; method: HttpMethod }>();
const routeParam = (): RegExp => /:([A-Za-z0-9_]+)/g;

function toPattern(path: string): RegExp {
  const escaped = path
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(routeParam(), "([^/]+)");
  return new RegExp(`^${escaped}/?$`);
}

function extractParams(
  path: string,
  match: RegExpMatchArray,
): Record<string, string> {
  const params: Record<string, string> = {};
  const keys: string[] = [];
  for (const m of path.matchAll(routeParam())) keys.push(m[1] ?? "");
  keys.forEach((key, i) => {
    const value = match[i + 1];
    if (key && value !== undefined) params[key] = decodeURIComponent(value);
  });
  return params;
}

export class Router {
  readonly routes: RouteDefinition[] = [];

  private add(
    method: HttpMethod,
    path: string,
    handler: Handler,
  ): RouteDefinition {
    const def: RouteDefinition = { method, path, handler };
    this.routes.push(def);
    return def;
  }

  get(path: string, handler: Handler) {
    return this.chain(this.add("GET", path, handler));
  }
  post(path: string, handler: Handler) {
    return this.chain(this.add("POST", path, handler));
  }
  put(path: string, handler: Handler) {
    return this.chain(this.add("PUT", path, handler));
  }
  patch(path: string, handler: Handler) {
    return this.chain(this.add("PATCH", path, handler));
  }
  delete(path: string, handler: Handler) {
    return this.chain(this.add("DELETE", path, handler));
  }
  options(path: string, handler: Handler) {
    return this.chain(this.add("OPTIONS", path, handler));
  }
  head(path: string, handler: Handler) {
    return this.chain(this.add("HEAD", path, handler));
  }

  private chain(def: RouteDefinition): {
    name: (name: string) => RouteDefinition;
  } {
    return {
      name: (name: string) => {
        def.name = name;
        namedRoutes.set(name, { path: def.path, method: def.method });
        return def;
      },
    };
  }

  /** Bun.serve-compatible fetch handler with param extraction. */
  fetch = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const method = req.method.toUpperCase() as HttpMethod;
    for (const def of this.routes) {
      if (def.method !== method) continue;
      const match = url.pathname.match(toPattern(def.path));
      if (!match) continue;
      const ctx: HttpContext = {
        req,
        params: extractParams(def.path, match),
        cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
      };
      return def.handler(ctx);
    }
    return new Response("Not Found", { status: 404 });
  };
}

export function createRouter(): Router {
  return new Router();
}

export function defineRoutes(
  router: Router,
  register: (router: Router) => void,
): Router {
  register(router);
  return router;
}

/** Build a path from a registered route name. */
export function route<Name extends RouteName>(
  name: Name,
  params?: RouteParamsFor<Name>,
): string {
  const entry = namedRoutes.get(name as string);
  if (!entry) throw new Error(`Unknown route: ${String(name)}`);
  const scope = (params ?? {}) as Record<string, string | number>;
  return entry.path.replace(routeParam(), (_, key: string) => {
    const value = scope[key];
    if (value === undefined) throw new Error(`Missing route param: ${key}`);
    return encodeURIComponent(String(value));
  });
}

export function routeNames(): readonly string[] {
  return [...namedRoutes.keys()];
}
