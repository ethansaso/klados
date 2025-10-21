import { queryOptions } from "@tanstack/react-query";
import axios from "axios";
import { taxa as taxaTbl } from "../../db/schema/taxa/taxa";

type TaxonRow = typeof taxaTbl.$inferSelect;
export type CurrentTaxon = Pick<TaxonRow, "id" | "canonical" | "rank"> | null;

export const DEPLOY_URL = "http://localhost:3000";

export const taxonQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["taxa", id],
    queryFn: () =>
      axios
        .get<TaxonRow>(DEPLOY_URL + "/api/taxa/" + id)
        .then((r) => r.data)
        .catch(() => {
          throw new Error("Failed to fetch taxon");
        }),
  });

export const taxaQueryOptions = () =>
  queryOptions({
    queryKey: ["taxa"],
    queryFn: () =>
      axios
        .get<TaxonRow[]>(DEPLOY_URL + "/api/taxa")
        .then((r) => r.data)
        .catch(() => {
          throw new Error("Failed to fetch taxa");
        }),
  });
