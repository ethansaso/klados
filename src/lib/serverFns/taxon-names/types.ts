import { taxonName } from "../../../db/schema/schema";

export type NameRow = typeof taxonName.$inferSelect;
export type NameDTO = Pick<
  NameRow,
  "id" | "taxonId" | "value" | "locale" | "isPreferred"
>;
