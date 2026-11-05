/**
 * App-level colour roles mapped to Chakra semantic tokens from `lib/theme.ts`.
 * Use these (or the semantic tokens directly) instead of raw `brand.*` values
 * or hex codes so the colour scheme stays in one place.
 */
export const COLORS = {
  page: "bg.subtle",
  card: "bg.panel",
  raised: "bg.subtle",
  raisedHover: "bg.muted",
  inverted: "bg.inverted",
  onInverted: "fg.inverted",
  border: "border",
  borderStrong: "border.emphasized",
  text: "fg",
  muted: "fg.muted",
  subtle: "fg.subtle",
  link: "brand.fg",
  primary: "brand.solid",
  primaryHover: "brand.hover",
  primaryActive: "brand.hover",
  primarySurface: "brand.subtle",
  onPrimary: "brand.contrast",
  accent: "accent.solid",
  accentSurface: "accent.subtle",
  success: "success.solid",
  successSurface: "success.subtle",
  successBorder: "success.emphasized",
  danger: "danger.solid",
  dangerSurface: "danger.subtle",
  dangerBorder: "danger.emphasized",
  dangerSurfaceHover: "danger.muted",
  dangerSurfaceActive: "danger.muted",
  focus: "brand.focusRing",
  backdrop: "bg.inverted/70",
} as const;

/**
 * The colour variables defined in `app/globals.css`, read directly. Use these
 * where a colour must come straight from globals.css (for example SVG charts).
 */
export const CSS_COLORS = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  card: "var(--card)",
  border: "var(--border)",
  muted: "var(--muted)",
} as const;

/** A light tint of a globals.css colour, for chip and pill backgrounds. */
export function cssTint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
