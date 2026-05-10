// Provider registry — single lookup point for the three impls + their
// metadata (default model, model dropdown options, human-readable label).
//
// Keep this file dumb. The settings page reads MODEL_OPTIONS to populate
// the model select; postVisualReview / postImageOfText resolve the active
// provider via PROVIDERS[settings.provider]. All three providers MUST stay
// in sync: adding a new one means adding it everywhere.

import { anthropicProvider } from './anthropic.ts'
import { googleProvider } from './google.ts'
import { openRouterProvider } from './openrouter.ts'
import type { ProviderId, VisionProvider } from './provider.ts'

export const PROVIDERS: Record<ProviderId, VisionProvider> = {
  openrouter: openRouterProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
}

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  google: 'Google',
}

/** Default model used when the user hasn't picked one. Mirrors `defaultModel`
 *  on each provider impl (kept here too for the dropdown's initial value). */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  openrouter: openRouterProvider.defaultModel,
  anthropic: anthropicProvider.defaultModel,
  google: googleProvider.defaultModel,
}

/** Curated dropdown options per provider. Short list of vision-capable models
 *  the user is likely to want. Verify against current provider docs before
 *  releases — model IDs change as families roll forward. */
export const MODEL_OPTIONS: Record<ProviderId, string[]> = {
  openrouter: [
    'anthropic/claude-haiku-4.5',
    'anthropic/claude-sonnet-4.5',
    'google/gemini-2.5-flash',
    'openai/gpt-4o-mini',
  ],
  anthropic: ['claude-haiku-4-5', 'claude-sonnet-4-5'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro'],
}

/** Provider-shaped placeholder for the API key input (helps the user
 *  recognise that they're pasting the right kind of secret). */
export const KEY_PLACEHOLDER: Record<ProviderId, string> = {
  openrouter: 'sk-or-v1-…',
  anthropic: 'sk-ant-…',
  google: 'AIza…',
}

/** Where to get a key — surfaced under the input as a hint. */
export const KEY_SOURCE_URL: Record<ProviderId, string> = {
  openrouter: 'openrouter.ai/keys',
  anthropic: 'console.anthropic.com',
  google: 'aistudio.google.com/apikey',
}
