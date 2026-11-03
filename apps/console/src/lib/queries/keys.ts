/**
 * The key shape every catalog-style domain shares, identical to the React
 * console's per-hook factories: `[name]`, `[name, "list"]`,
 * `[name, "list", params]`, `[name, "detail"]` and `[name, "detail", id]`.
 * Invalidating `lists()` refreshes every list of the domain, whatever its
 * params; `detail(id)` refreshes one record.
 */
export function entityKeys<const Name extends string>(name: Name) {
  const all = [name] as const;
  const lists = () => [...all, "list"] as const;
  const details = () => [...all, "detail"] as const;
  return {
    all,
    lists,
    list: (params: Record<string, unknown>) => [...lists(), params] as const,
    details,
    detail: (id: string) => [...details(), id] as const,
  };
}
