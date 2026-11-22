import z from "zod";
import { MEDIA_LICENSES } from "../../../../../../../db/utils/mediaLicense";

/**
 * File and attribution fields ride along so the editor can show and credit
 * photos without refetching.
 */
export const mediaFormItemSchema = z.object({
  id: z.number().int(),
  storageKey: z.string(),
  contentType: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  owner: z.string(),
  license: z.enum(MEDIA_LICENSES),
  source: z.string(),
});

export type MediaFormItem = z.infer<typeof mediaFormItemSchema>;
