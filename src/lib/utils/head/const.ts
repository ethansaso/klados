export const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);
export const GA_ID = import.meta.env.VITE_GA_ID;
