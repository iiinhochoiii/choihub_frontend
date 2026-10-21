// 색상은 CSS 변수로 정의하고(GlobalStyle 참고) 다크모드는 변수 값만 교체한다.
export const theme = {
  colors: {
    background: "var(--color-bg)",
    surface: "var(--color-surface)",
    surfaceMuted: "var(--color-surface-muted)",
    surfaceHover: "var(--color-surface-hover)",
    border: "var(--color-border)",
    borderStrong: "var(--color-border-strong)",
    text: "var(--color-text)",
    textMuted: "var(--color-text-muted)",
    textSubtle: "var(--color-text-subtle)",
    primary: "var(--color-primary)",
    primaryHover: "var(--color-primary-hover)",
    primarySoft: "var(--color-primary-soft)",
    onPrimary: "#ffffff",
    success: "var(--color-success)",
    successSoft: "var(--color-success-soft)",
    warning: "var(--color-warning)",
    warningSoft: "var(--color-warning-soft)",
    danger: "var(--color-danger)",
    dangerSoft: "var(--color-danger-soft)",
    info: "var(--color-info)",
    infoSoft: "var(--color-info-soft)",
    overlay: "var(--color-overlay)",
  },
  fonts: {
    sans: 'var(--font-geist-sans), "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif',
    mono: "var(--font-geist-mono), monospace",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
    md: "0 4px 12px rgba(15, 23, 42, 0.08)",
    lg: "0 16px 40px rgba(15, 23, 42, 0.16)",
  },
  layout: {
    sidebarWidth: "248px",
    topbarHeight: "60px",
    contentMaxWidth: "1280px",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
} as const;

export const mq = {
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,
  dark: "@media (prefers-color-scheme: dark)",
} as const;

export type AppTheme = typeof theme;
