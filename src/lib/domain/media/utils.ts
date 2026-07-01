import { SUPPORTED_IMAGE_TYPES } from "./validation";

/* Map of content type to extension */
const extMap: Record<(typeof SUPPORTED_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function extFromContentType(
  ct: (typeof SUPPORTED_IMAGE_TYPES)[number],
): string {
  const ext = extMap[ct];
  if (!ext) throw new Error(`Unsupported content type: ${ct}`);
  return ext;
}
