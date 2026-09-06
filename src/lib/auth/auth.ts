import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../../../db/client";
import * as schema from "../../../db/schema/schema";
import { requireAccountPolicyMiddleware } from "./enforcement";
import { resend } from "./resend";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,

    // TODO: password reset
    requireEmailVerification:
      process.env.NODE_ENV === "production" ||
      process.env.ENABLE_VERIFICATION_IN_DEV === "true",
    // sendResetPassword: async ({ user, url, token }, req) => { await sendEmail({ to: user.email, subject: "Reset your password", text: url }); },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      if (
        process.env.NODE_ENV === "development" &&
        process.env.ENABLE_VERIFICATION_IN_DEV !== "true"
      ) {
        // DEV: skip sending email, just log the verification URL
        console.log(
          `[DEV] Verification URL for ${user.email}: ${url}?token=${token}`,
        );
        return;
      }

      if (!resend) {
        console.error(
          "Resend client not configured. Cannot send verification email.",
        );
        return;
      }

      // PRODUCTION: send verification email via Resend
      await resend.emails.send({
        from: "no-reply@klados.bio",
        to: user.email,
        subject: "Verify your email address",
        text: `Click this link to verify your email: ${url}`,
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
  },
  plugins: [
    username({
      // validator: only letters/numbers/underscore/dash
      usernameValidator: (u) => /^[A-Za-z0-9_-]+$/.test(u),
      validationOrder: { username: "post-normalization" },
    }),
    tanstackStartCookies(),
  ],
  user: {
    additionalFields: {
      username: { type: "string", required: true, unique: true },
      description: { type: "string", required: false },
      role: {
        type: "string",
        required: true,
        input: false,
        defaultValue: "user",
      },
    },
  },
  hooks: {
    before: requireAccountPolicyMiddleware,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // TODO: Logging
  // hooks: {
  //   before: createAuthMiddleware(async (ctx) => { /* audit/log */ }),
  //   after: createAuthMiddleware(async (ctx) => { /* metrics */ }),
  // },
  // onAPIError: { errorURL: "/auth/error" },
  // logger: { level: "error" },
});

export type Session = typeof auth.$Infer.Session;
