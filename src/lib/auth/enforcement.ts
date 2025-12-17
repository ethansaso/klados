import { APIError, createAuthMiddleware } from "better-auth/api";
import { BAD_PW_MESSAGE, passwordSchema } from "./validation";

const RESERVED = new Set(["admin", "settings", "edit", "me"]);
type AuthMiddlewareCtx = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

function isReserved(u: unknown) {
  return typeof u === "string" && RESERVED.has(u.trim().toLowerCase());
}
async function enforceReservedUsernames(ctx: AuthMiddlewareCtx) {
  // Sign-up / update
  if (ctx.path === "/sign-up/email" || ctx.path === "/update-user") {
    const u = ctx.body?.username ?? ctx.body?.displayUsername;
    if (isReserved(u)) {
      throw new APIError("BAD_REQUEST", {
        message: "That username is reserved.",
      });
    }
  }

  // Availability: respond { available: false } for reserved names
  if (ctx.path === "/is-username-available") {
    const u = ctx.body?.username;
    if (isReserved(u)) {
      // short-circuit with an "unavailable" response
      return ctx.json({ available: false });
    }
  }
}

async function enforceUsername(ctx: AuthMiddlewareCtx) {
  // Require on sign-up
  if (ctx.path === "/sign-up/email") {
    const u = ctx.body?.username ?? ctx.body?.displayUsername;
    if (typeof u !== "string" || !u.trim()) {
      throw new APIError("BAD_REQUEST", { message: "Username is required." });
    }
  }

  // Disallow clearing username on update
  if (ctx.path === "/update-user") {
    if ("username" in ctx.body) {
      const u = ctx.body?.username;
      if (u == null || String(u).trim() === "") {
        throw new APIError("BAD_REQUEST", {
          message: "Username cannot be removed.",
        });
      }
    }
  }
}

async function enforceStrongPassword(ctx: AuthMiddlewareCtx) {
  // ! Enforce on all Better Auth endpoints that accept a new password
  const pathsNeedingCheck = new Set([
    "/sign-up/email",
    "/reset-password",
    "/change-password",
  ]);

  if (!pathsNeedingCheck.has(ctx.path)) return;

  // sign-up uses `password`; reset/change use `newPassword`
  const pwd: string | undefined = ctx.body?.password ?? ctx.body?.newPassword;

  if (!pwd || !passwordSchema.parse(pwd)) {
    throw new APIError("BAD_REQUEST", {
      message: BAD_PW_MESSAGE,
    });
  }
}

export const requireAccountPolicyMiddleware = createAuthMiddleware(
  async (ctx) => {
    // Order matters: reserved check can short-circuit availability with ctx.json
    const maybeResponse = await enforceReservedUsernames(ctx);
    if (maybeResponse) return;

    await enforceUsername(ctx);
    await enforceStrongPassword(ctx);
  }
);
