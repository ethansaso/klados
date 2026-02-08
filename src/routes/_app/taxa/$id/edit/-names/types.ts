import type { NameItemForm } from "./validation";

export type LocaleEntry = {
  code: string;
  label: string;
  entries: { item: NameItemForm }[];
};
