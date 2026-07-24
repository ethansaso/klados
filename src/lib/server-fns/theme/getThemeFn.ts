import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
  DEFAULT_THEME,
  isThemeMode,
  THEME_COOKIE_NAME,
} from "../../utils/theme";

/** Reads theme from request cookie. */
export const getThemeFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const cookieValue = getCookie(THEME_COOKIE_NAME);
    return isThemeMode(cookieValue) ? cookieValue : DEFAULT_THEME;
  },
);
