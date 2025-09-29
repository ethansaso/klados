import { APIError, createAuthMiddleware } from "better-auth/api";

const STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
const RESERVED = new Set(["admin", "settings", "edit"]);

function isReserved(u: unknown) {
  return typeof u === "string" && RESERVED.has(u.trim().toLowerCase());
}
async function enforceReservedUsernames(ctx: any) {
  // Sign-up / update
  if (ctx.path === "/sign-up/email" || ctx.path === "/update-user") {
    const u =
      (ctx.body as any)?.username ?? (ctx.body as any)?.displayUsername;
    if (isReserved(u)) {
      throw new APIError("BAD_REQUEST", {
        message: "That username is reserved.",
      });
    }
  }

  // Availability: respond { available: false } for reserved names
  if (ctx.path === "/is-username-available") {
    const u = (ctx.body as any)?.username;
    if (isReserved(u)) {
      // short-circuit with an "unavailable" response
      return ctx.json({ available: false });
    }
  }
}

async function enforceUsername(ctx: any) {
  // Require on sign-up
  if (ctx.path === "/sign-up/email") {
    const u = (ctx.body as any)?.username ?? (ctx.body as any)?.displayUsername;
    if (typeof u !== "string" || !u.trim()) {
      throw new APIError("BAD_REQUEST", { message: "Username is required." });
    }
  }

  // Disallow clearing username on update
  if (ctx.path === "/update-user") {
    if ("username" in ctx.body) {
      const u = (ctx.body as any)?.username;
      if (u == null || String(u).trim() === "") {
        throw new APIError("BAD_REQUEST", {
          message: "Username cannot be removed.",
        });
      }
    }
  }
}

async function enforceStrongPassword(ctx: any) {
  // ! Enforce on all Better Auth endpoints that accept a new password
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
}

export const requireAccountPolicyMiddleware = createAuthMiddleware(async (ctx) => {
  // Order matters: reserved check can short-circuit availability with ctx.json
  const maybeResponse = await enforceReservedUsernames(ctx);
  if (maybeResponse) return;

  await enforceUsername(ctx);
  await enforceStrongPassword(ctx);
});