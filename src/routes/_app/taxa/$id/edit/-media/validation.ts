import z from "zod";
import { MEDIA_LICENSES } from "../../../../../../../db/utils/mediaLicense";

/** Attribution rides along so the editor can credit photos without refetching. */
export const mediaFormItemSchema = z.object({
  id: z.number().int(),
  storageKey: z.string(),
  owner: z.string(),
  license: z.enum(MEDIA_LICENSES),
  source: z.string(),
});

export type MediaFormItem = z.infer<typeof mediaFormItemSchema>;
