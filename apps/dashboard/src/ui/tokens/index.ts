// Design tokens from the console design (v3 cloud-console layout).
export const color = {
  page: "#F2F4F7",
  surface: "#FFFFFF",
  border: "#D6DCE4",
  text: "#111827",
  textMuted: "#4B5563",
  primary: "#1F5BD8",
  primaryHover: "#1546AE",
  danger: "#B42318",
  success: "#145C38",
} as const;

export const radius = { sm: 4, md: 6, lg: 8 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const font = {
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;
