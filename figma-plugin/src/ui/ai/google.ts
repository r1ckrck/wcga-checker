// Google AI Studio (Gemini) — generateContent API.
//
// Endpoint:  https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// Auth:      ?key=<key> as URL query param (also accepts x-goog-api-key header)
// JSON mode: generationConfig.responseMimeType: 'application/json'
// System:    top-level systemInstruction.parts[0].text (NOT in contents[])
// Image:     part with inline_data: { mime_type, data }
// Response:  candidates[0].content.parts[0].text → JSON.parse
//
// CORS caveat: Google's CORS support from browser contexts has been reported
// as inconsistent — works in some regions/configs, blocked in others. The
// fetch failure mode (`TypeError: Failed to fetch`) is indistinguishable
// from a real network failure, so we tag fetch errors as `cors` on this
// provider so the UI can suggest the OpenRouter fallback.

import {
  combineSignals,
  ProviderError,
  classifyHttpStatus,
  safeReadText,
  type VisionProvider,
  type VisionRequest,
  type VisionResponse,
} from './provider.ts'
import { stripJsonFences } from './strip-fences.ts'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export const googleProvider: VisionProvider = {
  id: 'google',
  defaultModel: 'gemini-2.5-flash',
  async call(req: VisionRequest, opts): Promise<VisionResponse> {
    const url = `${BASE}/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`
    const { signal, cleanup } = combineSignals(req.timeoutMs, req.signal)
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemPrompt }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: `image/${req.image.mimeType}`,
                    data: req.image.base64,
                  },
                },
                { text: req.userText },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal,
      })
    } catch (e) {
      cleanup()
      // Aborts are still timeouts, not CORS — preserve that distinction.
      if (e instanceof Error && e.name === 'AbortError') {
        throw new ProviderError('timeout', 0, 'request aborted (timeout or user cancel)')
      }
      // Otherwise default to `cors` for Google. The fetch API can't tell us
      // whether a TypeError came from CORS rejection, DNS failure, or
      // offline; on Google specifically CORS is the most likely cause and
      // the UI surfaces a helpful "try OpenRouter" suggestion for it.
      throw new ProviderError('cors', 0, e instanceof Error ? e.message : String(e))
    }

    if (!response.ok) {
      const text = await safeReadText(response)
      cleanup()
      throw classifyHttpStatus(response.status, text || response.statusText)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (e) {
      cleanup()
      throw new ProviderError('bad-output', response.status, `non-JSON response: ${String(e)}`)
    } finally {
      cleanup()
    }

    const content = extractContent(payload)
    if (content == null) {
      throw new ProviderError(
        'bad-output',
        response.status,
        `unexpected response shape: ${JSON.stringify(payload).slice(0, 200)}`
      )
    }

    try {
      const parsed = JSON.parse(stripJsonFences(content))
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new ProviderError('bad-output', response.status, 'model returned non-object JSON')
      }
      return parsed as VisionResponse
    } catch (e) {
      if (e instanceof ProviderError) throw e
      throw new ProviderError('bad-output', response.status, `model returned non-JSON: ${content.slice(0, 200)}`)
    }
  },
}

/** Gemini returns `candidates[0].content.parts[0].text`. */
function extractContent(payload: unknown): string | null {
  if (!isObject(payload)) return null
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return null
  const first = candidates[0]
  if (!isObject(first)) return null
  const content = (first as { content?: unknown }).content
  if (!isObject(content)) return null
  const parts = (content as { parts?: unknown }).parts
  if (!Array.isArray(parts) || parts.length === 0) return null
  for (const part of parts) {
    if (!isObject(part)) continue
    const text = (part as { text?: unknown }).text
    if (typeof text === 'string') return text
  }
  return null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
