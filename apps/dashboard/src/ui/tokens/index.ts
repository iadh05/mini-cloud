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
  topBar: "#0E1A2B",
  topBarText: "#E6EBF2",
  topBarAccent: "#7DA2FF",
  navActive: "#EEF3FD",
} as const;

/** Badge colors per kind of status: background and text, contrast checked in the design. */
export const statusTone = {
  neutral: { bg: "#EEF0F3", fg: "#374151" },
  progress: { bg: "#FDF1E1", fg: "#8A4B05" },
  success: { bg: "#E6F4EC", fg: "#145C38" },
  stopped: { bg: "#E5E7EB", fg: "#1F2937" },
  danger: { bg: "#FDECEA", fg: "#A41E14" },
} as const;
export type StatusTone = keyof typeof statusTone;

export const radius = { sm: 4, md: 6, lg: 8 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const font = {
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const layout = { topBarHeight: 52, sideNavWidth: 240, pageMaxWidth: 1240 } as const;
