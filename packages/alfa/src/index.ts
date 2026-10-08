/**
 * alfa — minimal backend framework on Bun. Single-package, zero-dep modules.
 */

import { type Container, createContainer } from "./container/index";
import type { Handler } from "./http/index";
import { createRouter, type Router } from "./routing/index";

export const version = "0.0.1";

export interface AppOptions {
  /** Routes registration callback. */
  routes?: (router: Router) => void;
  /** Port used by listen(). Default 3000. */
  port?: number;
  /** Fallback handler when no route matches. */
  notFound?: Handler;
}

export interface App {
  readonly container: Container;
  readonly router: Router;
  fetch(req: Request): Promise<Response>;
  /** Start a Bun.serve server. Returns the server handle. */
  listen(port?: number): ReturnType<typeof Bun.serve>;
}

export function defineApp(options: AppOptions = {}): App {
  const container = createContainer();
  const router = createRouter();
  options.routes?.(router);

  const fetchHandler = async (req: Request): Promise<Response> => {
    const response = await router.fetch(req);
    if (response.status === 404 && options.notFound) {
      return options.notFound({
        req,
        params: {},
        cookies: new Bun.CookieMap(req.headers.get("cookie") ?? ""),
      });
    }
    return response;
  };

  return {
    container,
    router,
    fetch: fetchHandler,
    listen: (port = options.port ?? 3000) =>
      Bun.serve({
        port,
        fetch: fetchHandler,
      }),
  };
}

export * as auth from "./auth/index";
export * as console from "./console/index";
export * as container from "./container/index";
export * as database from "./database/index";
export * as http from "./http/index";
export * as routing from "./routing/index";
export * as session from "./session/index";
export * as utils from "./utils/index";
export * as validation from "./validation/index";
