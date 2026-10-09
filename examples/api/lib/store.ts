export interface Item {
  id: string;
  name: string;
  done: boolean;
}

const items = new Map<string, Item>();
let counter = 0;

export function list(limit?: number): Item[] {
  const all = [...items.values()];
  return limit === undefined ? all : all.slice(0, limit);
}

export function find(id: string): Item | undefined {
  return items.get(id);
}

export function create(name: string): Item {
  counter += 1;
  const item: Item = { id: String(counter), name, done: false };
  items.set(item.id, item);
  return item;
}

export function update(
  id: string,
  patch: Partial<Omit<Item, "id">>,
): Item | undefined {
  const item = items.get(id);
  if (!item) return undefined;
  const next: Item = { ...item, ...patch };
  items.set(id, next);
  return next;
}

export function remove(id: string): boolean {
  return items.delete(id);
}
