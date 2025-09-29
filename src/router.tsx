import {
  QueryClient
} from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
  queryClient: QueryClient;
};

export function getRouter() {
  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
