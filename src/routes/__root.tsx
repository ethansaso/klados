import NiceModal from "@ebay/nice-modal-react";
import { Theme } from "@radix-ui/themes";
import { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCssUrl from "../assets/styles/main.css?url";
import { ToastHost } from "../components/ToastHost";
import { GA_ID, seo } from "../lib/seo";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => {
    const { meta, links } = seo({
      title: "Klados",
      description: "Twenty-first century identification.",
      image: "/logos/LogoBrand.png",
      canonicalPath: "/",
    });

    const baseLinks = [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCssUrl },
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
      links: [...baseLinks, ...links],
      scripts,
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <NiceModal.Provider>
        <Outlet />
      </NiceModal.Provider>
      <ToastHost />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme accentColor="amber" panelBackground="solid">
          {children}
        </Theme>
        <Scripts />
      </body>
    </html>
  );
}
