import { NameItem } from "../../../../../../lib/api/taxon-names/validation";

export type LocaleEntry = {
  code: string;
  label: string;
  entries: { item: NameItem; index: number }[];
};
