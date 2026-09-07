import z from "zod";
import { MEDIA_LICENSES } from "../../../../db/utils/mediaLicense";
import { trimmed, trimmedNonEmpty } from "../../validation/trimmedOptional";

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

export const mediaMetaSchema = z.object({
  license: z.enum(MEDIA_LICENSES),
  owner: trimmed("Must be a string").max(200, "Max 200 characters"),
  source: trimmed("Must be a string").max(2000, "Max 2000 characters"),
  title: trimmedNonEmpty("Please provide a title.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
});

export const uploadMediaWireItemSchema = z.discriminatedUnion("type", [
  mediaMetaSchema.extend({
    type: z.literal("url"),
    url: z.url(),
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

export const updateMediaSchema = mediaMetaSchema.partial().extend({
  id: z.int("Must be an integer").positive("Must be positive"),
});

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
export type MediaMeta = z.infer<typeof mediaMetaSchema>;
export type UploadMediaWireItem = z.infer<typeof uploadMediaWireItemSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
