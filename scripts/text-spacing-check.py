#!/usr/bin/env python3
"""
WCAG 1.4.12 text spacing checker.
Input: font size and spacing properties in px.
Output: per-property pass/fail with actual vs required values.

Usage:
  python text-spacing-check.py --font-size 14 --line-height 22 --letter-spacing 0 --paragraph-spacing 0
  python text-spacing-check.py --font-size 16 --line-height 24
  python text-spacing-check.py --font-size 14 --line-height 22 --letter-spacing 0 --single-line
"""

import argparse


def check_spacing(font_size, line_height=None, letter_spacing=None, paragraph_spacing=None, word_spacing=None, single_line=False):
    results = []

    # Line height ≥ 1.5 × fontSize
    if line_height is not None:
        required = font_size * 1.5
        ratio = line_height / font_size if font_size > 0 else 0
        results.append({
            "property": "line-height",
            "actual": f"{line_height}px ({ratio:.2f}x)",
            "required": f"{required}px (1.5x)",
            "pass": line_height >= required
        })
    else:
        results.append({
            "property": "line-height",
            "actual": "not set",
            "required": f"{font_size * 1.5}px (1.5x)",
            "pass": None
        })

    # Letter spacing ≥ 0.12 × fontSize
    if letter_spacing is not None:
        required = font_size * 0.12
        ratio = letter_spacing / font_size if font_size > 0 else 0
        results.append({
            "property": "letter-spacing",
            "actual": f"{letter_spacing}px ({ratio:.2f}x)",
            "required": f"{required}px (0.12x)",
            "pass": letter_spacing >= required
        })
    else:
        results.append({
            "property": "letter-spacing",
            "actual": "not set",
            "required": f"{font_size * 0.12}px (0.12x)",
            "pass": None
        })

    # Paragraph spacing ≥ 2 × fontSize (skip for single-line text)
    if not single_line:
        if paragraph_spacing is not None:
            required = font_size * 2
            ratio = paragraph_spacing / font_size if font_size > 0 else 0
            results.append({
                "property": "paragraph-spacing",
                "actual": f"{paragraph_spacing}px ({ratio:.2f}x)",
                "required": f"{required}px (2x)",
                "pass": paragraph_spacing >= required
            })
        else:
            results.append({
                "property": "paragraph-spacing",
                "actual": "not set",
                "required": f"{font_size * 2}px (2x)",
                "pass": None
            })

    # Word spacing ≥ 0.16 × fontSize
    if word_spacing is not None:
        required = font_size * 0.16
        ratio = word_spacing / font_size if font_size > 0 else 0
        results.append({
            "property": "word-spacing",
            "actual": f"{word_spacing}px ({ratio:.2f}x)",
            "required": f"{required}px (0.16x)",
            "pass": word_spacing >= required
        })

    return results


def main():
    parser = argparse.ArgumentParser(description="WCAG 1.4.12 text spacing checker")
    parser.add_argument("--font-size", type=float, required=True, help="Font size in px")
    parser.add_argument("--line-height", type=float, default=None, help="Line height in px")
    parser.add_argument("--letter-spacing", type=float, default=None, help="Letter spacing in px")
    parser.add_argument("--paragraph-spacing", type=float, default=None, help="Paragraph spacing in px")
    parser.add_argument("--word-spacing", type=float, default=None, help="Word spacing in px")
    parser.add_argument("--single-line", action="store_true", default=False, help="Skip paragraph-spacing check (single-line text)")
    args = parser.parse_args()

    results = check_spacing(
        font_size=args.font_size,
        line_height=args.line_height,
        letter_spacing=args.letter_spacing,
        paragraph_spacing=args.paragraph_spacing,
        word_spacing=args.word_spacing,
        single_line=args.single_line
    )

    for r in results:
        status = "pass" if r["pass"] is True else "fail" if r["pass"] is False else "unknown"
        print(f"{r['property']}: {r['actual']} (needs {r['required']}) → {status}")


if __name__ == "__main__":
    main()
