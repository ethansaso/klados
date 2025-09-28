import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";

const STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,

    // TODO: email verification/reset
    // requireEmailVerification: true,
    // sendResetPassword: async ({ user, url, token }, req) => { await sendEmail({ to: user.email, subject: "Reset your password", text: url }); },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    username({
      // validator: only letters/numbers/underscore/dash
      usernameValidator: (u) => /^[A-Za-z0-9_-]+$/.test(u),
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Enforce on all endpoints that accept a new password
      const pathsNeedingCheck = new Set([
        "/sign-up/email",
        "/reset-password",
        "/change-password",
      ]);

      if (!pathsNeedingCheck.has(ctx.path)) return;

      // sign-up uses `password`; reset/change use `newPassword`
      const pwd: string | undefined =
        (ctx.body as any)?.password ?? (ctx.body as any)?.newPassword;

      if (!pwd || !STRONG_PW.test(pwd)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Password must be 8-128 chars and include at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol.",
        });
      }
    }),
  },
  // TODO: Hooks & logging
  // hooks: {
  //   before: createAuthMiddleware(async (ctx) => { /* audit/log */ }),
  //   after: createAuthMiddleware(async (ctx) => { /* metrics */ }),
  // },
  // onAPIError: { errorURL: "/auth/error" },
  // logger: { level: "error" },
});
