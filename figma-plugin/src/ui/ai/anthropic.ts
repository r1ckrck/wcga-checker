// Anthropic — direct Messages API, distinct from OpenAI-compatible shape.
//
// Endpoint:  https://api.anthropic.com/v1/messages
// Auth:      x-api-key: <key>
//            anthropic-version: 2023-06-01
//            anthropic-dangerous-direct-browser-access: true
// JSON mode: not native — rely on prompt + stripJsonFences fallback
// System:    top-level `system` field (NOT a role inside messages)
// Image:     content part of type 'image' with source.type='base64', media_type, data
// Response:  content[0].text (string) → JSON.parse
//
// CORS: supported as of August 2024 when the
// `anthropic-dangerous-direct-browser-access: true` header is sent. The header
// name is intentionally provocative — Anthropic wants browser callers to
// acknowledge that they're shipping the API key client-side.

import {
  classifyFetchError,
  classifyHttpStatus,
  combineSignals,
  ProviderError,
  safeReadText,
  type VisionProvider,
  type VisionRequest,
  type VisionResponse,
} from './provider.ts'
import { stripJsonFences } from './strip-fences.ts'

const URL = 'https://api.anthropic.com/v1/messages'
const MAX_TOKENS = 4096 // vision JSON outputs are tiny — generous headroom

export const anthropicProvider: VisionProvider = {
  id: 'anthropic',
  defaultModel: 'claude-haiku-4-5',
  async call(req: VisionRequest, opts): Promise<VisionResponse> {
    const { signal, cleanup } = combineSignals(req.timeoutMs, req.signal)
    let response: Response
    try {
      response = await fetch(URL, {
        method: 'POST',
        headers: {
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: opts.model,
          max_tokens: MAX_TOKENS,
          system: req.systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: `image/${req.image.mimeType}`,
                    data: req.image.base64,
                  },
                },
                { type: 'text', text: req.userText },
              ],
            },
          ],
        }),
        signal,
      })
    } catch (e) {
      cleanup()
      throw classifyFetchError(e)
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

/** Anthropic returns `content: [{ type: 'text', text: '…' }, …]`. Pull the
 *  first text part. (Vision responses can also include `tool_use` blocks
 *  but we don't request tools, so the first part is always text.) */
function extractContent(payload: unknown): string | null {
  if (!isObject(payload)) return null
  const content = (payload as { content?: unknown }).content
  if (!Array.isArray(content) || content.length === 0) return null
  for (const part of content) {
    if (!isObject(part)) continue
    if ((part as { type?: unknown }).type !== 'text') continue
    const text = (part as { text?: unknown }).text
    if (typeof text === 'string') return text
  }
  return null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
