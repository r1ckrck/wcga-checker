import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runTypographyCheck } from '../runners/typography.ts'
import type {
  AuditDTO,
  ImageElement,
  TextElement,
  TextSegment,
  ResolvedFill,
} from '../../shared/dtos.ts'

const fill = (): ResolvedFill => ({
  hex: '#000000',
  rgba: [0, 0, 0, 1],
  source: { kind: 'raw' },
})

const segment = (over: Partial<TextSegment> = {}): TextSegment => ({
  start: 0,
  end: 5,
  fontFamily: 'Inter',
  fontStyle: 'Regular',
  fontWeight: 400,
  fontSize: 14,
  lineHeightUnit: 'PIXELS',
  lineHeightPx: 21,
  // Default letter-spacing chosen to satisfy WCAG 1.4.12's 0.12x rule for the
  // default 14px font (14 * 0.12 = 1.68). Tests that need a failing fixture
  // override this explicitly.
  letterSpacingPx: 2,
  textCase: 'ORIGINAL',
  textDecoration: 'NONE',
  fill: fill(),
  ...over,
})

const text = (over: Partial<TextElement> = {}): TextElement => ({
  kind: 'text',
  id: over.id ?? 't:1',
  name: over.name ?? 'Body',
  characters: 'Hello',
  isSingleLine: over.isSingleLine ?? true,
  isSingleVisualLine: over.isSingleVisualLine ?? true,
  segments: over.segments ?? [segment()],
  background: { kind: 'unresolvable', reason: 'no-ancestor' },
  bbox: { x: 0, y: 0, width: 100, height: 20 },
  parentChain: [],
})

const image = (over: Partial<ImageElement>): ImageElement => ({
  kind: 'image',
  id: over.id ?? 'i:1',
  name: over.name ?? 'photo',
  width: over.width ?? 100,
  height: over.height ?? 80,
  isExempt: over.isExempt ?? false,
  imageHash: over.imageHash ?? null,
})

const dto = (over: Partial<AuditDTO> = {}): AuditDTO => ({
  component: { id: '0:1', name: 'C', type: 'COMPONENT', width: 0, height: 0, pageId: 'p', pageName: 'P', modeName: null },
  texts: over.texts ?? [],
  interactives: [],
  images: over.images ?? [],
  formInputs: [],
  variants: null,
  warnings: [],
})

test('1.4.12: line-height meets 1.5x → pass', () => {
  const f = runTypographyCheck(dto({ texts: [text()] }))
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'pass')
})

test('1.4.12: multi-visual-line text with line-height below 1.5x → flag', () => {
  const f = runTypographyCheck(
    dto({
      texts: [
        text({
          isSingleLine: false,
          isSingleVisualLine: false,
          segments: [segment({ lineHeightPx: 18 })],
        }),
      ],
    })
  )
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'flag')
})

test('1.4.12: soft-wrapped paragraph (no \\n but multi visual lines) still flags low line-height', () => {
  // Long text with no hard breaks but bbox tall enough to wrap visually.
  // Old logic auto-passed via isSingleLine=true; new logic correctly flags
  // because isSingleVisualLine is false.
  const f = runTypographyCheck(
    dto({
      texts: [
        text({
          isSingleLine: true,
          isSingleVisualLine: false,
          segments: [segment({ lineHeightPx: 18 })],
        }),
      ],
    })
  )
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'flag')
})

test('1.4.12: truly single-visual-line text auto-passes line-height even when below 1.5x', () => {
  // Single rendered line — line-height has no rendered effect, so a numeric
  // shortfall is theoretical only and shouldn't surface as a flag.
  const f = runTypographyCheck(
    dto({
      texts: [
        text({
          isSingleLine: true,
          isSingleVisualLine: true,
          segments: [segment({ lineHeightPx: 18 })],
        }),
      ],
    })
  )
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'pass')
})

test('1.4.12: AUTO line-height passes (no fixed constraint)', () => {
  const f = runTypographyCheck(
    dto({
      texts: [
        text({
          segments: [segment({ lineHeightUnit: 'AUTO', lineHeightPx: null })],
        }),
      ],
    })
  )
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'pass')
})

test('1.4.12: single-line skips paragraph spacing requirement', () => {
  const f = runTypographyCheck(
    dto({
      texts: [text({ isSingleLine: true })],
    })
  )
  // Should not have a paragraph-spacing flag.
  const paragraphFlag = f.find(
    x => x.status === 'flag' && (x.details as { property?: string } | undefined)?.property === 'paragraph-spacing'
  )
  assert.equal(paragraphFlag, undefined)
})

test('1.4.12: dominant segment chosen by largest fontSize', () => {
  const small = segment({ fontSize: 12, lineHeightPx: 18, start: 0, end: 5 })   // 18/12 = 1.5 → pass
  const big = segment({ fontSize: 32, lineHeightPx: 32, start: 5, end: 12 })    // 32/32 = 1.0 → fail
  const f = runTypographyCheck(dto({ texts: [text({ segments: [small, big] })] }))
  const r = f.find(x => x.criterion === '1.4.12')
  assert.equal(r?.status, 'flag') // dominant = big segment which fails
})

test('1.4.5: exempt logo passes', () => {
  const f = runTypographyCheck(dto({ images: [image({ name: 'Brand Logo', isExempt: true })] }))
  const r = f.find(x => x.criterion === '1.4.5')
  assert.equal(r?.status, 'pass')
})

test('1.4.5: name with "title" flags', () => {
  const f = runTypographyCheck(dto({ images: [image({ name: 'page-title', width: 30, height: 10 })] }))
  const r = f.find(x => x.criterion === '1.4.5')
  assert.equal(r?.status, 'flag')
  assert.match(r?.message ?? '', /name suggests/)
})

// Bug 7 — bare-size flag removed. Large non-named-as-text images are now
// deferred to the AI image-of-text check (handled in the UI). The runner
// emits no entry for them.
test('1.4.5: large image without text-y name → no runner entry (deferred to AI)', () => {
  const f = runTypographyCheck(dto({ images: [image({ name: 'banner', width: 800, height: 200 })] }))
  const r = f.find(x => x.criterion === '1.4.5')
  assert.equal(r, undefined)
})

test('1.4.5: small avatar without text-y name → no runner entry', () => {
  const f = runTypographyCheck(dto({ images: [image({ name: 'avatar', width: 24, height: 24 })] }))
  const r = f.find(x => x.criterion === '1.4.5')
  assert.equal(r, undefined)
})

test('1.4.5: name-flagged image still flags deterministically (cheap signal)', () => {
  const f = runTypographyCheck(dto({ images: [image({ name: 'hero-title-banner', width: 800, height: 200 })] }))
  const r = f.find(x => x.criterion === '1.4.5')
  assert.equal(r?.status, 'flag')
  assert.match(r?.message ?? '', /name suggests/)
})
