import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { uploadMedia } from "../../domain/media/service";
import {
  SUPPORTED_IMAGE_TYPES,
  uploadMediaWireItemSchema,
} from "../../domain/media/validation";

export const uploadMediaFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({ items: z.array(uploadMediaWireItemSchema).min(1) }),
  )
  .handler(async ({ data, context }) => {
    const inputs = await Promise.all(
      data.items.map(async (item) => {
        let body: Buffer;
        let contentType: (typeof SUPPORTED_IMAGE_TYPES)[number];

        // TODO: do something less SSRF-prone here.
        if (item.type === "url") {
          const res = await fetch(item.url);
          if (!res.ok)
            throw new Error(`Failed to fetch media from URL: ${res.status}`);
          const rawContentType =
            res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const contentTypeResult = z
            .enum(SUPPORTED_IMAGE_TYPES)
            .safeParse(rawContentType);
          if (!contentTypeResult.success)
            throw new Error(`Unsupported content type: ${rawContentType}`);
          body = Buffer.from(await res.arrayBuffer());
          contentType = contentTypeResult.data;
        } else {
          body = Buffer.from(item.base64, "base64");
          contentType = item.contentType;
        }

        return {
          body,
          contentType,
          license: item.license,
          owner: item.owner,
          source: item.source,
          title: item.title,
          uploadedBy: context.user.id,
        };
      }),
    );

    return uploadMedia(inputs);
  });
