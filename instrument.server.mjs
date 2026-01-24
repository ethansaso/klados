import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://0442575edd7f257a4c0eb4dd312cfebe@o4510767609413632.ingest.us.sentry.io/4510767610855424",
  // TODO: we need a privacy policy for this!!!
  sendDefaultPii: true,
});
