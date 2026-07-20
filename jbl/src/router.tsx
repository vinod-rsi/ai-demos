import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // Served from a subpath on GitHub Pages (e.g. /ai-demos/jbl/), so the router must
    // strip that prefix. BASE_URL keeps this in sync with `base` in vite.config.ts;
    // it is "/" in dev, so local development is unaffected.
    basepath: import.meta.env.BASE_URL,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
