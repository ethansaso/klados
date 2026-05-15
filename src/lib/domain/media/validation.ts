import z from "zod";
import { MEDIA_LICENSES } from "../../../../db/utils/mediaLicense";

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

const mediaMetaSchema = z.object({
  license: z.enum(MEDIA_LICENSES),
  owner: z.string(),
  source: z.string(),
  title: z.string().optional(),
});

export const uploadMediaWireItemSchema = z.discriminatedUnion("type", [
  mediaMetaSchema.extend({
    type: z.literal("url"),
    url: z.string().url(),
  }),
  mediaMetaSchema.extend({
    type: z.literal("file"),
    base64: z
      .string()
      .min(1)
      .max(20 * 1024 * 1024, "File size too large (max 15MB)"), // Base64 encoding inflates size by ~33%, so max raw size is ~15MB
    contentType: z.enum(SUPPORTED_IMAGE_TYPES),
  }),
]);

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
export type MediaMeta = z.infer<typeof mediaMetaSchema>;
export type UploadMediaWireItem = z.infer<typeof uploadMediaWireItemSchema>;
