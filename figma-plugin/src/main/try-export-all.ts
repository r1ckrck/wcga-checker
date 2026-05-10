// Generic "try each item, drop failures" helper used by the parallel
// per-node export passes (variant thumbs, image candidates).
//
// Pure — no figma globals. Just a small Promise.all wrapper that filters
// out null results, used wherever per-item extraction is best-effort.
//
// Behaviour:
//   - Runs `fn` on every item in parallel
//   - Items whose `fn` returns null OR throws are silently dropped
//   - Returns only the successful, non-null results in their original order
//
// This codifies the "silent fallback" policy used across the per-node
// export sites: one bad item never sinks the whole batch.

export async function tryExportAll<I, O>(
  items: I[],
  fn: (item: I) => Promise<O | null>
): Promise<O[]> {
  const results: Array<O | null> = await Promise.all(
    items.map(async item => {
      try {
        return await fn(item)
      } catch {
        return null
      }
    })
  )
  return results.filter((r): r is O => r !== null)
}
