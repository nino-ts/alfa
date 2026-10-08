/**
 * Minimal IoC container with register / make / boot lifecycle.
 */

export type Factory<T> = (container: Container) => T | Promise<T>;

interface Binding {
  factory: Factory<unknown>;
  singleton: boolean;
  eager: boolean;
  instance?: unknown;
}

export interface Container {
  register<T>(
    key: string,
    factory: Factory<T>,
    options?: { singleton?: boolean; eager?: boolean },
  ): void;
  make<T>(key: string): Promise<T>;
  boot(): Promise<void>;
}

export function createContainer(): Container {
  const bindings = new Map<string, Binding>();
  let booted = false;

  const resolve = async (key: string): Promise<unknown> => {
    const binding = bindings.get(key);
    if (!binding) throw new Error(`Nothing registered for key: ${key}`);
    if (binding.singleton && binding.instance !== undefined)
      return binding.instance;
    const created = await binding.factory(container);
    if (binding.singleton) binding.instance = created;
    return created;
  };

  const container: Container = {
    register: (key, factory, options) => {
      bindings.set(key, {
        factory: factory as Factory<unknown>,
        singleton: options?.singleton ?? true,
        eager: options?.eager ?? false,
      });
    },
    make: async <T>(key: string): Promise<T> => (await resolve(key)) as T,
    boot: async () => {
      if (booted) return;
      booted = true;
      for (const [key, binding] of bindings) {
        if (binding.eager) {
          const instance = await resolve(key);
          if (
            instance &&
            typeof instance === "object" &&
            typeof (instance as { boot?: unknown }).boot === "function"
          ) {
            await (instance as { boot: () => unknown }).boot();
          }
        }
      }
    },
  };

  return container;
}
