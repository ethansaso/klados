export function createCacheHeader(seconds: number) {
  return { "Cache-Control": `public, max-age=${seconds}` };
}