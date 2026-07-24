import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { THEME_COOKIE_NAME, THEME_VALUES } from "../../utils/theme";

/** Persists user's theme preference as a cookie for SSR reads. */
export const setThemeFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      theme: z.enum(THEME_VALUES),
    }),
  )
  .handler(async ({ data }) => {
    setCookie(THEME_COOKIE_NAME, data.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  });
