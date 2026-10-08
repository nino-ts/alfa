import { Router } from "#alfa/routing";
import { registerRoutes } from "../routes";

export type App = {
  router: Router;
};

export function createApp(): App {
  const router = new Router();
  registerRoutes(router);
  return { router };
}
