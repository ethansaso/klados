import { createServerFn } from "@tanstack/react-start";
import { getTaxaSitemapEntries } from "../../domain/taxa/service";

export const getTaxaSitemapEntriesFn = createServerFn({
  method: "GET",
}).handler(
  async (): Promise<
    {
      loc: string;
      lastmod: string;
    }[]
  > => {
    return getTaxaSitemapEntries();
  },
);
