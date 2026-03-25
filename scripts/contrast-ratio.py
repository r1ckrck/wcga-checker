#!/usr/bin/env python3
"""
WCAG contrast ratio calculator.
Input: two colors as hex (#RRGGBB) or rgba(R,G,B,A) + optional threshold.
Output: contrast ratio, pass/fail per threshold.

Usage:
  python contrast-ratio.py "#333333" "#FFFFFF"
  python contrast-ratio.py "#333333" "#FFFFFF" --threshold 4.5
  python contrast-ratio.py "rgba(255,255,255,0.4)" "#002953"
  python contrast-ratio.py "#333333" "#FFFFFF" --threshold 4.5 --fg-opacity 0.9
"""

import sys
import re
import argparse


def parse_color(color_str):
    """Parse hex or rgba color string to (r, g, b, a) where values are 0-255, a is 0-1."""
    color_str = color_str.strip().lower()

    # hex: #RGB, #RRGGBB, #RRGGBBAA
    if color_str.startswith("#"):
        h = color_str.lstrip("#")
        if len(h) == 3:
            r, g, b = int(h[0]*2, 16), int(h[1]*2, 16), int(h[2]*2, 16)
            return (r, g, b, 1.0)
        elif len(h) == 6:
            r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
            return (r, g, b, 1.0)
        elif len(h) == 8:
            r, g, b, a = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) / 255
            return (r, g, b, a)

    # rgba(R, G, B, A) or rgb(R, G, B)
    match = re.match(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)', color_str)
    if match:
        r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
        a = float(match.group(4)) if match.group(4) else 1.0
        return (r, g, b, a)

    raise ValueError(f"Cannot parse color: {color_str}")


def blend_on_background(fg_rgba, bg_rgb):
    """Blend a semi-transparent foreground color onto an opaque background."""
    r1, g1, b1, a = fg_rgba
    r2, g2, b2 = bg_rgb
    r = r1 * a + r2 * (1 - a)
    g = g1 * a + g2 * (1 - a)
    b = b1 * a + b2 * (1 - a)
    return (r, g, b)


def relative_luminance(r, g, b):
    """Calculate relative luminance per WCAG 2.1 formula."""
    def linearize(v):
        v = v / 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def contrast_ratio(color1_rgb, color2_rgb):
    """Calculate contrast ratio between two RGB colors."""
    l1 = relative_luminance(*color1_rgb)
    l2 = relative_luminance(*color2_rgb)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def main():
    parser = argparse.ArgumentParser(description="WCAG contrast ratio calculator")
    parser.add_argument("fg", help="Foreground color (hex or rgba)")
    parser.add_argument("bg", help="Background color (hex or rgba)")
    parser.add_argument("--threshold", type=float, default=4.5, help="Contrast threshold (default: 4.5)")
    parser.add_argument("--fg-opacity", type=float, default=1.0, help="Additional opacity multiplier for foreground")
    args = parser.parse_args()

    try:
        fg = parse_color(args.fg)
        bg = parse_color(args.bg)
    except ValueError as e:
        print(f"error: {e}")
        sys.exit(1)

    # Apply additional opacity if provided
    if args.fg_opacity < 1.0:
        fg = (fg[0], fg[1], fg[2], fg[3] * args.fg_opacity)

    # If foreground has alpha, blend onto background
    if fg[3] < 1.0:
        bg_rgb = (bg[0], bg[1], bg[2])
        fg_blended = blend_on_background(fg, bg_rgb)
    else:
        fg_blended = (fg[0], fg[1], fg[2])

    bg_rgb = (bg[0], bg[1], bg[2])
    ratio = contrast_ratio(fg_blended, bg_rgb)
    passed = ratio >= args.threshold

    print(f"ratio: {ratio:.2f}")
    print(f"threshold: {args.threshold}")
    print(f"pass: {str(passed).lower()}")
    print(f"fg_resolved: rgb({int(fg_blended[0])},{int(fg_blended[1])},{int(fg_blended[2])})")
    print(f"bg_resolved: rgb({bg_rgb[0]},{bg_rgb[1]},{bg_rgb[2]})")


if __name__ == "__main__":
    main()
