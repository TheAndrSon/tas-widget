function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Рекурсивно сливает patch в base. Массивы и примитивы заменяются целиком. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch)) return base
  if (!isPlainObject(base)) return patch as T
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    const current = result[key]
    result[key] = isPlainObject(value) && isPlainObject(current) ? deepMerge(current, value) : value
  }
  return result as T
}
