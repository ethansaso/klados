// Falls back to production so builds without the env var still emit absolute
// URLs (canonicals, og:image); link-preview crawlers can't resolve relative ones
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://klados.bio";
export const GA_ID = import.meta.env.VITE_GA_ID;
