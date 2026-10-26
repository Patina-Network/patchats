export function trimValues<T extends Record<string, string>>(values: T): T {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as T;
}
