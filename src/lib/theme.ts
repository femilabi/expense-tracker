import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Expense Tracker colour scheme: "Navy and teal".
 *
 * The raw brand colours live in `tokens` and should only be referenced here.
 * Components use the semantic tokens below (`fg`, `bg.panel`, `border`,
 * `brand.solid`, ...) or the `COLORS` map in `components/shared/colors.ts`,
 * so the whole app can be re-themed by editing this file alone.
 */

/** Builds the semantic tokens Chakra expects for a `colorPalette`. */
function palette({
  solid,
  hover,
  contrast,
  fg,
}: {
  solid: string;
  hover: string;
  contrast: string;
  fg: string;
}) {
  return {
    solid: { value: solid },
    hover: { value: hover },
    contrast: { value: contrast },
    fg: { value: fg },
    subtle: { value: `color-mix(in srgb, ${solid} 10%, transparent)` },
    muted: { value: `color-mix(in srgb, ${solid} 20%, transparent)` },
    emphasized: { value: `color-mix(in srgb, ${solid} 30%, transparent)` },
    focusRing: { value: solid },
  };
}

const config = defineConfig({
  preflight: false,
  globalCss: {
    html: {
      colorPalette: "brand",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          navy: { value: "#0B2545" },
          "navy-deep": { value: "#071A33" },
          teal: { value: "#0E8388" },
          "teal-dark": { value: "#08676B" },
          gold: { value: "#F2A900" },
          "gold-dark": { value: "#8A6100" },
          green: { value: "#1B9E5A" },
          "green-dark": { value: "#157A46" },
          red: { value: "#E4572E" },
          "red-dark": { value: "#B8401D" },
          "soft-white": { value: "#F7F9FB" },
          mist: { value: "#E2E8F0" },
          slate: { value: "#5B6B7F" },
          white: { value: "#FFFFFF" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Surfaces
        bg: {
          DEFAULT: { value: "{colors.brand.white}" },
          panel: { value: "{colors.brand.white}" },
          subtle: { value: "{colors.brand.soft-white}" },
          muted: { value: "{colors.brand.mist}" },
          emphasized: { value: "{colors.brand.mist}" },
          inverted: { value: "{colors.brand.navy}" },
        },
        // Text
        fg: {
          DEFAULT: { value: "{colors.brand.navy}" },
          muted: { value: "{colors.brand.slate}" },
          subtle: { value: "{colors.brand.slate}" },
          inverted: { value: "{colors.brand.white}" },
          error: { value: "{colors.brand.red}" },
          success: { value: "{colors.brand.green}" },
          warning: { value: "{colors.brand.gold-dark}" },
        },
        // Lines
        border: {
          DEFAULT: { value: "{colors.brand.mist}" },
          muted: { value: "{colors.brand.mist}" },
          subtle: { value: "{colors.brand.mist}" },
          emphasized: { value: "{colors.brand.slate}" },
          inverted: { value: "{colors.brand.navy}" },
          error: { value: "{colors.brand.red}" },
          success: { value: "{colors.brand.green}" },
          warning: { value: "{colors.brand.gold}" },
        },
        // colorPalette="brand": primary actions, links, focus rings
        brand: palette({
          solid: "{colors.brand.teal}",
          hover: "{colors.brand.navy}",
          contrast: "{colors.brand.white}",
          fg: "{colors.brand.teal}",
        }),
        // colorPalette="accent": highlights and secondary data series
        accent: palette({
          solid: "{colors.brand.gold}",
          hover: "{colors.brand.gold-dark}",
          contrast: "{colors.brand.navy}",
          fg: "{colors.brand.gold-dark}",
        }),
        // colorPalette="success" / "danger": money in, money out, status
        success: palette({
          solid: "{colors.brand.green}",
          hover: "{colors.brand.green-dark}",
          contrast: "{colors.brand.white}",
          fg: "{colors.brand.green}",
        }),
        danger: palette({
          solid: "{colors.brand.red}",
          hover: "{colors.brand.red-dark}",
          contrast: "{colors.brand.white}",
          fg: "{colors.brand.red}",
        }),
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
