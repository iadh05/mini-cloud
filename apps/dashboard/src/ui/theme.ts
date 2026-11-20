import { createTheme, type MantineColorsTuple } from "@mantine/core";
import { color, font, radius } from "./tokens/index.ts";

// Ten shades for Mantine; shade 6 is the primary color, shade 7 its hover.
const brand: MantineColorsTuple = [
  color.navActive,
  "#DCE5FB",
  "#B6CBF6",
  "#8DAEF0",
  "#6A94EA",
  "#4A7CE3",
  color.primary,
  color.primaryHover,
  "#103A8F",
  "#0B2C6E",
];

/** Mantine theme built from the design tokens. */
export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 6,
  colors: { brand },
  black: color.text,
  fontFamily: font.sans,
  fontFamilyMonospace: font.mono,
  headings: { fontFamily: font.sans, fontWeight: "600" },
  defaultRadius: "md",
  radius: {
    xs: `${String(radius.sm)}px`,
    sm: `${String(radius.sm)}px`,
    md: `${String(radius.md)}px`,
    lg: `${String(radius.lg)}px`,
  },
});
