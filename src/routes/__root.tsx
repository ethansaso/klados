import { Theme } from "@radix-ui/themes";
import { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GA_ID, seo } from "../lib/seo";
import appCssUrl from "../styles/styles.css?url";

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
  head: () => {
    const { meta, links } = seo({
      title: "TaxoKeys",
      description: "Twenty-first century identification.",
      image: "/static/media/taxo-keys-logo.png",
      canonicalPath: "/",
    });

    const baseLinks = [
      { rel: "stylesheet", href: appCssUrl },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      // TODO: consider these font optimizations?
      // { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      // { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@200;400;600;700&display=swap" },
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
      links: [...baseLinks, ...links],
      scripts,
    };
  },
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
