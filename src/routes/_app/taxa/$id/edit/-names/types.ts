import { NameItem } from "../../../../../../lib/domain/taxon-names/validation";

export type LocaleEntry = {
  code: string;
  label: string;
  entries: { item: NameItem; index: number }[];
};
