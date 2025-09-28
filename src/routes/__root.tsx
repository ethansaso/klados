import type { ReactNode } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Theme } from "@radix-ui/themes";
import { auth } from "../lib/auth/auth";
import { db } from "../db/client";
import { user as userTbl } from "../db/schema/auth";
import { getWebRequest } from "@tanstack/react-start/server";
import { getCurrentUser } from "../lib/getCurrentUser";

type UserRow = typeof userTbl.$inferSelect;
export type CurrentUser = Pick<
  UserRow,
  "id" | "username" | "displayUsername" | "name" | "email" | "image" | "role"
> | null;

export const Route = createRootRouteWithContext<{
  user: CurrentUser;
}>()({
  loader: async ({ context }) => {
    // TanStack Start provides the original Request at context.request
    const user = await getCurrentUser();
    return { user };
  },

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
