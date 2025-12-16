import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createSource } from "../../domain/sources/service";
import { SourceDTO } from "../../domain/sources/types";
import { sourceItemSchema } from "../../domain/sources/validation";

export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(sourceItemSchema)
  .handler(async ({ data }): Promise<SourceDTO> => {
    const dto = await createSource({
      source: {
        name: data.name,
        authors: data.authors,
        publisher: data.publisher,
        note: data.note,
        isbn: data.isbn,
        url: data.url,
        publicationYear: data.publicationYear,
      },
    });

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
