import "../assets/styles/main.css";

import NiceModal from "@ebay/nice-modal-react";
import { Theme } from "@radix-ui/themes";
import {
  QueryClient,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  stripSearchParams,
} from "@tanstack/react-router";
import { type ReactNode, useLayoutEffect } from "react";
import { ToastHost } from "../components/ToastHost";
import { themeQueryOptions } from "../lib/queries/theme";
import { meQueryOptions } from "../lib/queries/users";
import { setThemeFn } from "../lib/server-fns/theme/setThemeFn";
import { GA_ID } from "../lib/utils/head/const";
import { rootSeo } from "../lib/utils/head/rootSeo";
import { DEFAULT_THEME, type ThemeMode } from "../lib/utils/theme";
import { paginationDefaults } from "../lib/validation/pagination";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const [user] = await Promise.all([
      context.queryClient.ensureQueryData(meQueryOptions()),
      context.queryClient.ensureQueryData(themeQueryOptions()),
    ]);

    return { user };
  },
  head: ({ match }) => {
    const { meta } = rootSeo({
      title: "Klados",
      description: "Twenty-first century identification.",
      image: "/logos/LogoBrand.png",
      canonicalUrl: match.pathname,
    });

    const baseLinks = [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous" as const,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ];

    const scripts =
      GA_ID && import.meta.env.PROD
        ? [
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
              async: true,
            },
            {
              // Inline bootstrap (kept tiny and safe)
              children: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `,
            },
          ]
        : [];

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...meta,
      ],
      links: baseLinks,
      scripts,
    };
  },
  search: {
    middlewares: [
      stripSearchParams({
        ...paginationDefaults,
        q: "",
      }),
    ],
  },
  component: RootComponent,
});

function RootComponent() {
  const queryClient = useQueryClient();
  const { data: theme } = useSuspenseQuery(themeQueryOptions());

  // Adopt OS preference if no cookie
  useLayoutEffect(() => {
    if (theme !== null) return;

    const detected: ThemeMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches
      ? "dark"
      : "light";

    queryClient.setQueryData(themeQueryOptions().queryKey, detected);
    void setThemeFn({ data: { theme: detected } });
  }, [theme, queryClient]);

  return (
    <RootDocument theme={theme ?? DEFAULT_THEME}>
      <NiceModal.Provider>
        <Outlet />
      </NiceModal.Provider>
      <ToastHost />
    </RootDocument>
  );
}

function RootDocument({
  theme,
  children,
}: Readonly<{
  theme: "light" | "dark";
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme
          appearance={theme}
          hasBackground
          accentColor="amber"
          panelBackground="solid"
        >
          {children}
        </Theme>
        <Scripts />
      </body>
    </html>
  );
}
