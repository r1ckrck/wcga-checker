// Provider abstraction for vision-capable LLMs.
//
// Every supported AI service is reduced to a single `call()` method that
// takes a system prompt + user text + one image and returns parsed JSON.
// Per-service differences (endpoint, auth header, body shape, system-prompt
// placement, image-part shape, response path) are sealed inside each impl.
//
// Why an interface, not a switch in one file: each provider has a few quirks
// (Anthropic needs a special CORS header, Google's CORS support is shaky,
// OpenRouter accepts a JSON-mode flag the others don't). Hiding those behind
// a tiny interface keeps the call sites — runVisualReview, runImageOfText —
// completely provider-agnostic.

export type ProviderId = 'openrouter' | 'anthropic' | 'google'

export type ImageMime = 'png' | 'jpeg' | 'webp' | 'gif'

export interface VisionRequest {
  /** Full system-prompt text (already includes any "respond as JSON" instruction). */
  systemPrompt: string
  /** Free-form user text — orientation block, layer metadata, etc. */
  userText: string
  /** Single image attachment. Base64 only — providers differ in whether they
   *  want a data URL or raw base64; the impl handles that. */
  image: { base64: string; mimeType: ImageMime }
  /** Per-call timeout in milliseconds. Combined with `signal` inside the impl. */
  timeoutMs: number
  /** Caller-owned abort signal (e.g. user closed plugin) — combined with timeout. */
  signal?: AbortSignal
}

/** Parsed JSON object from the model. Per-call validators downstream check
 *  the actual shape (`observations[]`, `{hasUIText, reason}`, etc). */
export type VisionResponse = Record<string, unknown>

/** Categorical error code surfaced to the UI so the renderer can pick a
 *  human-readable, action-suggesting message per provider. */
export type ProviderErrorCode =
  | 'auth'        // 401/403 — bad or expired key
  | 'rate-limit'  // 429
  | 'network'     // fetch threw (DNS/offline/connection refused)
  | 'timeout'     // AbortError from our combined signal
  | 'bad-output'  // HTTP 200 but the response shape isn't what we expected
  | 'http'        // any other non-2xx status
  | 'cors'        // browser blocked the request before it left the iframe

const MAX_DETAIL_LEN = 500

export class ProviderError extends Error {
  readonly status: number
  readonly code: ProviderErrorCode
  readonly detail: string
  constructor(code: ProviderErrorCode, status: number, detail: string) {
    super(`${code}:${status} ${detail}`)
    this.name = 'ProviderError'
    this.code = code
    this.status = status
    this.detail = detail.length > MAX_DETAIL_LEN ? `${detail.slice(0, MAX_DETAIL_LEN)}…` : detail
  }
}

export interface VisionProvider {
  readonly id: ProviderId
  readonly defaultModel: string
  call(req: VisionRequest, opts: { apiKey: string; model: string }): Promise<VisionResponse>
}

// ── Shared helpers exposed to provider impls ─────────────────────

/** Combine a caller signal with a timeout signal. Returns a single signal
 *  that aborts on whichever fires first. Falls back to manual wiring if
 *  `AbortSignal.any` isn't available (very old runtimes). */
export function combineSignals(timeoutMs: number, caller?: AbortSignal): {
  signal: AbortSignal
  cleanup: () => void
} {
  const timeoutCtrl = new AbortController()
  const timer = setTimeout(() => timeoutCtrl.abort(), timeoutMs)
  const cleanup = () => clearTimeout(timer)

  // Prefer AbortSignal.any when available — single signal, automatic cleanup.
  type AbortSignalAnyFn = (signals: AbortSignal[]) => AbortSignal
  const anyFn = (AbortSignal as unknown as { any?: AbortSignalAnyFn }).any
  if (anyFn && caller) {
    return { signal: anyFn([timeoutCtrl.signal, caller]), cleanup }
  }
  if (!caller) return { signal: timeoutCtrl.signal, cleanup }

  // Manual fallback: forward caller aborts into the timeout controller.
  const onAbort = (): void => timeoutCtrl.abort()
  caller.addEventListener('abort', onAbort, { once: true })
  return {
    signal: timeoutCtrl.signal,
    cleanup: () => {
      cleanup()
      caller.removeEventListener('abort', onAbort)
    },
  }
}

/** Map a fetch failure to a `ProviderError` code. The `TypeError: Failed to
 *  fetch` shape covers both true network failures (offline, DNS) and CORS
 *  rejections — they're indistinguishable at the fetch API level. Each
 *  provider impl can override the default `network` code if it has more
 *  context (e.g. Google overrides to `cors`). */
export function classifyFetchError(e: unknown, defaultCode: ProviderErrorCode = 'network'): ProviderError {
  if (e instanceof Error && e.name === 'AbortError') {
    return new ProviderError('timeout', 0, 'request aborted (timeout or user cancel)')
  }
  return new ProviderError(defaultCode, 0, e instanceof Error ? e.message : String(e))
}

/** Map a non-2xx HTTP status to a `ProviderError` code. */
export function classifyHttpStatus(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError('auth', status, body)
  if (status === 429) return new ProviderError('rate-limit', status, body)
  return new ProviderError('http', status, body)
}

/** Safely read response body text without throwing on a re-read. */
export async function safeReadText(r: Response): Promise<string> {
  try {
    return await r.text()
  } catch {
    return ''
  }
}
