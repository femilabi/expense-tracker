import { COLORS, CSS_COLORS, cssTint } from "./colors";

export const focusRing = {
  outline: "2px solid",
  outlineColor: COLORS.focus,
  outlineOffset: "2px",
} as const;

export const surfaceStyles = {
  bg: COLORS.card,
  borderWidth: "1px",
  borderColor: COLORS.border,
  borderRadius: "xl",
  boxShadow: "sm",
} as const;

export const dialogSurfaceStyles = {
  ...surfaceStyles,
  p: { base: 5, md: 6 },
  boxShadow: "lg",
  outline: "none",
} as const;

export const controlStyles = {
  h: { base: "11", sm: "10" },
  bg: COLORS.card,
  borderWidth: "1px",
  borderColor: COLORS.border,
  borderRadius: "lg",
  color: COLORS.text,
  fontSize: "sm",
  focusRingColor: COLORS.focus,
  _placeholder: { color: COLORS.muted },
  _hover: { borderColor: COLORS.borderStrong },
  _focusVisible: {
    borderColor: COLORS.focus,
  },
} as const;

export const nativeSelectOptionStyles = {
  "& option": {
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
} as const;

export const primaryButtonStyles = {
  h: { base: "11", sm: "10" },
  px: 4,
  borderRadius: "lg",
  bg: COLORS.primary,
  color: COLORS.onPrimary,
  fontSize: "sm",
  fontWeight: "semibold",
  _hover: { bg: COLORS.primaryHover },
  _active: { bg: COLORS.primaryActive },
  _focusVisible: focusRing,
  _disabled: { opacity: 0.6, cursor: "not-allowed" },
} as const;

export const secondaryButtonStyles = {
  h: { base: "11", sm: "10" },
  px: 4,
  variant: "outline",
  bg: COLORS.card,
  borderColor: COLORS.border,
  borderRadius: "lg",
  color: COLORS.text,
  fontSize: "sm",
  fontWeight: "medium",
  _hover: { bg: COLORS.raised },
  _active: { bg: COLORS.raised },
  _focusVisible: focusRing,
} as const;

export const dangerButtonStyles = {
  h: { base: "11", sm: "10" },
  px: 4,
  variant: "outline",
  bg: COLORS.dangerSurface,
  borderColor: COLORS.dangerBorder,
  borderRadius: "lg",
  color: COLORS.text,
  fontSize: "sm",
  fontWeight: "semibold",
  _hover: { bg: COLORS.dangerSurfaceHover, borderColor: COLORS.danger },
  _active: { bg: COLORS.dangerSurfaceActive },
  _focusVisible: focusRing,
} as const;

export const dangerOutlineButtonStyles = {
  h: { base: "11", sm: "10" },
  px: 4,
  variant: "outline",
  bg: COLORS.card,
  borderColor: COLORS.dangerBorder,
  borderRadius: "lg",
  color: COLORS.text,
  fontSize: "sm",
  fontWeight: "semibold",
  _hover: { bg: COLORS.dangerSurface, borderColor: COLORS.danger },
  _active: { bg: COLORS.dangerSurfaceActive },
  _focusVisible: focusRing,
} as const;

export const errorTextStyles = {
  color: COLORS.text,
  borderLeftWidth: "2px",
  borderColor: COLORS.danger,
  ps: 2,
  fontSize: "xs",
} as const;

export const successTextStyles = {
  color: COLORS.text,
  bg: COLORS.successSurface,
  borderWidth: "1px",
  borderColor: COLORS.successBorder,
  borderRadius: "md",
  px: 3,
  py: 2,
  fontSize: "sm",
} as const;

export const metaLabelStyles = {
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: COLORS.muted,
} as const;

export const tableHeaderStyles = {
  ...metaLabelStyles,
  fontSize: "11px",
  py: 3,
} as const;

/** Bordered box that wraps a borderless input plus an attached addon. */
export const controlGroupStyles = {
  h: { base: "11", sm: "10" },
  bg: COLORS.card,
  borderWidth: "1px",
  borderColor: COLORS.border,
  rounded: "lg",
  _hover: { borderColor: COLORS.borderStrong },
  _focusWithin: {
    borderColor: COLORS.focus,
    ...focusRing,
  },
} as const;

/* ------------------------------------------------------------------------ */
/* "Soft glass" dashboard surfaces. Colours come from globals.css; shadows   */
/* and keyframes are theme tokens (`glass`, `glass-rise`, ...) in theme.ts. */
/* ------------------------------------------------------------------------ */

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Faint brand-tinted mesh behind the dashboard. Tints stay at 9% or below so
 * text placed directly on the page keeps its contrast.
 */
export const glassPageStyles = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  css: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "-10%",
      zIndex: -1,
      pointerEvents: "none",
      backgroundImage: [
        `radial-gradient(40% 35% at 88% 4%, ${cssTint(CSS_COLORS.secondary, 9)}, transparent 70%)`,
        `radial-gradient(35% 30% at 6% 55%, ${cssTint(CSS_COLORS.warning, 7)}, transparent 70%)`,
        `radial-gradient(40% 30% at 70% 96%, ${cssTint(CSS_COLORS.success, 6)}, transparent 70%)`,
      ].join(", "),
      animation: "mesh-drift 48s ease-in-out infinite alternate",
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    },
  },
} as const;

/**
 * Translucent card with a teal-to-transparent hairline border, white inner
 * highlight and layered navy shadow. The card stays 90% opaque white, so
 * --foreground and --muted text keep their contrast over the mesh.
 */
export const glassCardStyles = {
  position: "relative",
  minW: 0,
  p: { base: 5, md: 6 },
  borderRadius: "1.25rem",
  bg: `color-mix(in srgb, ${CSS_COLORS.card} 90%, transparent)`,
  backdropFilter: "blur(16px) saturate(150%)",
  boxShadow: "glass",
  // No hover lift: these cards aren't clickable as a whole, only their rows
  // and buttons are.
  animation: `glass-rise 0.6s ${EASE_OUT} both`,
  _motionReduce: { animation: "none" },
  css: {
    // Gradient hairline border: a masked layer that keeps only the 1px ring
    // between the padding box and the border box.
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      padding: "1px",
      pointerEvents: "none",
      background: `linear-gradient(140deg, ${cssTint(CSS_COLORS.secondary, 45)}, ${CSS_COLORS.border} 38%, ${cssTint(CSS_COLORS.border, 70)})`,
      // Masks only read opacity, so any opaque palette colour works here.
      WebkitMask: `linear-gradient(${CSS_COLORS.foreground} 0 0) content-box, linear-gradient(${CSS_COLORS.foreground} 0 0)`,
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
    },
  },
} as const;

/** Rounded-square badge with a soft teal gradient, for card titles and empty states. */
export const glassIconBadgeStyles = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxSize: "9",
  borderRadius: "xl",
  color: CSS_COLORS.secondary,
  bg: `linear-gradient(145deg, ${cssTint(CSS_COLORS.secondary, 18)}, ${cssTint(CSS_COLORS.secondary, 6)})`,
  borderWidth: "1px",
  borderColor: cssTint(CSS_COLORS.secondary, 20),
  boxShadow: "glass.badge",
} as const;

/** One pill shape for every status label and stat chip on the dashboard. */
export const glassPillStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "1",
  borderRadius: "full",
  fontSize: "xs",
  fontWeight: "semibold",
  lineHeight: "1rem",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  color: CSS_COLORS.foreground,
  borderWidth: "1px",
  borderColor: `color-mix(in srgb, ${CSS_COLORS.foreground} 6%, transparent)`,
} as const;

/** Hover/focus transition shared by interactive rows and buttons. */
export const glassTransition = {
  transition: `background-color 0.2s ${EASE_OUT}, transform 0.2s ${EASE_OUT}, box-shadow 0.2s ${EASE_OUT}`,
  _motionReduce: { transition: "none", transform: "none" },
} as const;
