// Reusable icon-count chip used in both the top report header and per-group
// card headers. Pure DOM helper — no figma globals, no fetch.
//
// Markup:
//   <span class="results__stat results__stat--check" title="N passed">
//     <svg class="icon"><use href="#icon-check"/></svg>
//     <span class="results__stat-count">N</span>
//   </span>

const SVG_NS = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

export type StatIcon = 'check' | 'warning' | 'prohibit'

export function buildStat(icon: StatIcon, n: number, label: string): HTMLElement {
  const span = document.createElement('span')
  span.className = `results__stat results__stat--${icon}`
  span.title = `${n} ${label}`

  span.appendChild(buildIcon(icon))

  const count = document.createElement('span')
  count.className = 'results__stat-count'
  count.textContent = String(n)
  span.appendChild(count)
  return span
}

/** Bare Phosphor icon SVG — no chrome, no count. Used inline in section
 * labels (e.g. "16 passed (✓) in this group") so the disclosure summary
 * carries the same visual cue as the stats chip in the card header. */
export function buildIcon(icon: StatIcon): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'icon')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const use = document.createElementNS(SVG_NS, 'use')
  // `href` is the modern attribute; `xlink:href` is the fallback that some
  // older WebKit-based renderers still need for `<use>` inside HTML.
  use.setAttribute('href', `#icon-${icon}`)
  use.setAttributeNS(XLINK_NS, 'xlink:href', `#icon-${icon}`)
  svg.appendChild(use)
  return svg
}
