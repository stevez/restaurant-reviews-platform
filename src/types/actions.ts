/**
 * Generic discriminated union for server action results.
 *
 * @example
 * // With data
 * ActionResult<{ imageUrl: string }>
 * // returns { success: true, data: { imageUrl: '/uploads/...' } }
 *
 * @example
 * // Without data (void operations like delete)
 * ActionResult
 * // returns { success: true }
 */
export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string; details?: unknown }
