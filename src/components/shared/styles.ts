import { COLORS } from "./colors";

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
