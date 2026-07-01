import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listGuides } from "../../domain/guides/service";
import { PaginationSchema } from "../../validation/pagination";

const GuideSearchSchema = PaginationSchema.extend({
  q: z.string().optional(),
});

export const listGuidesFn = createServerFn({ method: "GET" })
  .validator(GuideSearchSchema)
  .handler(async ({ data }) => {
    return listGuides(data);
  });
