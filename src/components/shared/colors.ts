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
