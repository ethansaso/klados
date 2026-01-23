import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const resend =
  RESEND_API_KEY &&
  (process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VERIFICATION_IN_DEV === "true")
    ? new Resend(RESEND_API_KEY)
    : null;
