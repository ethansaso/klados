import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { isThemeMode, THEME_COOKIE_NAME } from "../../utils/theme";

/** Reads theme from request cookie; null when unset (i.e. first nav to the site) */
export const getThemeFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const cookieValue = getCookie(THEME_COOKIE_NAME);
    return isThemeMode(cookieValue) ? cookieValue : null;
  },
);
