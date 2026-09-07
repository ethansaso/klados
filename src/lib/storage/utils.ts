export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;
export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
