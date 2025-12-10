import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listKeys } from "../../domain/keys/service";
import { PaginationSchema } from "../../validation/pagination";

const KeySearchSchema = PaginationSchema.extend({
  q: z.string().optional(),
});

export const listKeysFn = createServerFn({ method: "GET" })
  .inputValidator(KeySearchSchema)
  .handler(async ({ data }) => {
    return listKeys(data);
  });
