export const THEME_COOKIE_NAME = "theme";

export const THEME_VALUES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: ThemeMode = "light";

export function isThemeMode(value: unknown): value is ThemeMode {
  return THEME_VALUES.includes(value as ThemeMode);
}
