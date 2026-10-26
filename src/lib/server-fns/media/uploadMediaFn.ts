import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { uploadMedia } from "../../domain/media/service";
import { uploadMediaWireItemSchema } from "../../domain/media/validation";
import { SUPPORTED_IMAGE_TYPES } from "../../storage/utils";

export const uploadMediaFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(z.object({ items: z.array(uploadMediaWireItemSchema).min(1) }))
  .handler(async ({ data, context }) => {
    const inputs: Parameters<typeof uploadMedia>[0] = [];

    // Sequential, so picking several remote images doesn't burst their host
    for (const item of data.items) {
      let body: Buffer;
      let contentType: (typeof SUPPORTED_IMAGE_TYPES)[number];

      // TODO: do something less SSRF-prone here.
      if (item.type === "url") {
        const res = await fetch(item.url, {
          // Wikimedia rate-limits generic clients; its policy asks for a named tool with contact info
          headers: { "User-Agent": "Klados/1.0 (https://klados.bio)" },
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 200);
          throw new Error(
            `Failed to fetch media from URL: ${res.status} ${detail}`,
          );
        }
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

      inputs.push({
        body,
        contentType,
        license: item.license,
        owner: item.owner,
        source: item.source,
        title: item.title,
        uploadedBy: context.user.id,
      });
    }

    return uploadMedia(inputs);
  });
