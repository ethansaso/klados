import { Theme } from "@radix-ui/themes";
import { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h1>404 — Page not found</h1>
      <p>We couldn't find that page.</p>
      <a href="/">Go home</a>
    </main>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TaxoKeys",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
        <link rel="stylesheet" href="/src/styles/styles.css" />
      </head>
      <body>
        <Theme accentColor="amber" panelBackground="solid">
          {children}
          <Scripts />
        </Theme>
      </body>
    </html>
  );
}
