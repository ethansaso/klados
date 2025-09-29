import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { db } from "../../db/client";
import { requireAccountPolicyMiddleware } from "./enforcement";
import {
  ac,
  admin as adminRole,
  curator as curatorRole,
  user as userRole,
} from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,

    // TODO: email verification/reset
    // requireEmailVerification: true,
    // sendResetPassword: async ({ user, url, token }, req) => { await sendEmail({ to: user.email, subject: "Reset your password", text: url }); },
  },
  plugins: [
    username({
      // validator: only letters/numbers/underscore/dash
      usernameValidator: (u) => /^[A-Za-z0-9_-]+$/.test(u),
      validationOrder: { username: "post-normalization" },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      ac,
      roles: { user: userRole, curator: curatorRole, admin: adminRole },
    }),
  ],
  user: {
    additionalFields: {
      username: { type: "string", required: true, unique: true },
    }
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
