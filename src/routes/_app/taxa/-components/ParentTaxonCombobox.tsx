import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { a11yProps } from "../../../../components/inputs/ConditionalAlert";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../components/inputs/combobox/types";
import type { LeanTaxonDTO } from "../../../../lib/domain/taxa/types";
import { taxaQueryOptions } from "../../../../lib/queries/taxa";
import { formatTaxonName } from "../../../../lib/utils/formatting/formatTaxonName";

const PAGE_SIZE = 20;

type ParentTaxonComboboxProps = {
  id: string;
  value: number | null;
  onChange: (parentId: number | null) => void;
  /** Will prevent this id from appearing in results; useful for e.g. preventing self-parenting */
  excludeId?: number;
  /** Seeds initial parent value, which couldn't have been acquired from search. */
  initialParent?: LeanTaxonDTO | null;
  placeholder?: string;
  invalid?: boolean;
  errorId?: string;
};

const toOption = (t: LeanTaxonDTO): ComboboxOption => ({
  id: t.id,
  label: formatTaxonName(t.rank, t.acceptedName, "never"),
  hint: t.rank,
});

export function ParentTaxonCombobox({
  id,
  value,
  onChange,
  excludeId,
  initialParent = null,
  placeholder = "Select parent taxon",
  invalid = false,
  errorId = `${id}-error`,
}: ParentTaxonComboboxProps) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<LeanTaxonDTO | null>(null);

  const { data, isFetching } = useQuery(
    taxaQueryOptions(1, PAGE_SIZE, { q, status: ["active", "draft"] }),
  );

  const candidates = useMemo<LeanTaxonDTO[]>(
    () => (data?.items ?? []).filter((t) => t.id !== excludeId),
    [data, excludeId],
  );
  const options = useMemo(() => candidates.map(toOption), [candidates]);

  const selectedParent =
    value === null
      ? null
      : picked?.id === value
        ? picked
        : initialParent?.id === value
          ? initialParent
          : null;

  return (
    <SelectCombobox.Root
      id={id}
      value={selectedParent && toOption(selectedParent)}
      onValueChange={(opt) => {
        const next = opt
          ? (candidates.find((t) => t.id === opt.id) ?? null)
          : null;
        setPicked(next);
        onChange(next?.id ?? null);
      }}
      options={options}
      onQueryChange={setQ}
      loading={isFetching}
    >
      <SelectCombobox.Trigger
        placeholder={placeholder}
        {...a11yProps(errorId, invalid)}
      />
      <SelectCombobox.Content>
        <SelectCombobox.Input placeholder="Search taxa..." />
        <SelectCombobox.List>
          {options.map((option, index) => (
            <SelectCombobox.Item
              key={option.id}
              index={index}
              option={option}
            />
          ))}
        </SelectCombobox.List>
      </SelectCombobox.Content>
    </SelectCombobox.Root>
  );
}
