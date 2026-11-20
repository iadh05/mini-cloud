/** Every query key in one place, so invalidation is never a guess (docs/FRONTEND.md §5.3). */
export const qk = {
  resources: (type: string) => ["resources", type] as const,
  list: (type: string, params: Record<string, unknown> = {}) =>
    ["resources", type, "list", params] as const,
};
