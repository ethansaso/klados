import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  // Runs before Vite loads .env, so this must be in the process environment.
  dsn: process.env.VITE_SENTRY_DSN,
  // TODO: we need a privacy policy for this!!!
  sendDefaultPii: true,
});
