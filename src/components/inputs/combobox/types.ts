import type { ReactNode } from "react";

/** Public option shape required by the combobox. */
export type ComboboxOption = {
  id: number;
  label: string;
  hint?: ReactNode;
  /** Shown before the label, in the list and the trigger (e.g. a swatch). */
  adornment?: ReactNode;
};
