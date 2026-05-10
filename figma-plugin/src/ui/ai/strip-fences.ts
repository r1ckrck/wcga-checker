/**
 * Strip a leading/trailing markdown code fence (```json ... ``` or ``` ... ```)
 * if present. Some models (notably Haiku 4.5) wrap JSON in fences even when
 * the prompt explicitly says not to. Without this, the JSON.parse downstream
 * 502s on every call because backticks aren't valid JSON.
 *
 * Ported verbatim from the former server's openrouter.ts so the parsing
 * behavior matches across all provider impls.
 */
export function stripJsonFences(s: string): string {
  const trimmed = s.trim()
  const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return m ? m[1].trim() : trimmed
}
