import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  Button,
  Dialog,
  Flex,
  SegmentedControl,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SelectCombobox } from "../../../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { createSourceFn } from "../../../../../../lib/api/sources/createSourceFn";
import { SourceDTO } from "../../../../../../lib/domain/sources/types";
import { sourcesQueryOptions } from "../../../../../../lib/queries/sources";
import { formatPublication } from "./formatPublication";

// ! This component is only responsible for picking or creating a source, i.e. from the 'source' table.
// It does NOT handle configuration of the actual taxon source item (accessedAt, locator, note).

type Props = {
  onConfirm: (source: SourceDTO) => void;
};

const SourcePickerModal = NiceModal.create<Props>(({ onConfirm }) => {
  const modal = useModal();
  const qc = useQueryClient();
  const createSource = useServerFn(createSourceFn);

  const [activeTab, setActiveTab] = useState<string>("existing");

  // Existing source search
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ComboboxOption | null>(null);

  const { data: searchResp, isFetching } = useQuery(
    sourcesQueryOptions(1, 10, { q })
  );

  const options = useMemo<ComboboxOption[]>(() => {
    const items: SourceDTO[] = searchResp?.items ?? [];
    return items.map((s) => ({
      id: s.id,
      label: s.name,
      hint: [s.authors, s.publisher, s.publicationYear]
        .filter(Boolean)
        .join(" • "),
    }));
  }, [searchResp]);

  const selectedSource = useMemo(() => {
    if (!selected) return null;
    return (
      (searchResp?.items ?? []).find(
        (s: SourceDTO) => s.id === Number(selected.id)
      ) ?? null
    );
  }, [selected, searchResp]);

  // Create new
  const [newName, setNewName] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newPublisher, setNewPublisher] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newYear, setNewYear] = useState<string>("");

  const canConfirmExisting = !!selectedSource;
  const canConfirmNew = newName.trim().length > 0;

  const confirmExisting = () => {
    if (!selectedSource) return;
    onConfirm(selectedSource);
    modal.hide();
  };

  const confirmNew = async () => {
    if (!canConfirmNew) return;

    const created = await createSource({
      data: {
        name: newName.trim(),
        authors: newAuthors.trim(),
        publisher: newPublisher.trim(),
        url: newUrl.trim(),
        publicationYear: newYear === "" ? undefined : Number(newYear),
      },
    });

    onConfirm(created);
    qc.invalidateQueries({ queryKey: ["sources"] });
    modal.hide();
  };

  return (
    <Dialog.Root
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
    >
      <Dialog.Content maxWidth="450px" aria-describedby={undefined}>
        <Dialog.Title mb="2" size="5">
          Add a source
        </Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Search an existing source, or create a new one.
        </Dialog.Description>

        <SegmentedControl.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v)}
        >
          <SegmentedControl.Item value="existing">Search</SegmentedControl.Item>
          <SegmentedControl.Item value="new">Create New</SegmentedControl.Item>
        </SegmentedControl.Root>

        {activeTab === "existing" ? (
          <Flex direction="column" gap="3" mt="4">
            <SelectCombobox.Root
              value={selected}
              onValueChange={setSelected}
              options={options}
              onQueryChange={setQ}
            >
              <SelectCombobox.Trigger
                placeholder={isFetching ? "Searching…" : "Select a source"}
              />
              <SelectCombobox.Content>
                <SelectCombobox.Input />
                <SelectCombobox.List>
                  {options.map((opt, idx) => (
                    <SelectCombobox.Item
                      key={opt.id}
                      index={idx}
                      option={opt}
                    />
                  ))}
                </SelectCombobox.List>
              </SelectCombobox.Content>
            </SelectCombobox.Root>

            {selectedSource && (
              <Text size="2" color="gray">
                {formatPublication(selectedSource)}
              </Text>
            )}
          </Flex>
        ) : (
          <Flex direction="column" gap="3" mt="4">
            <TextField.Root
              placeholder="Title"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
            />
            <TextField.Root
              placeholder="Authors"
              value={newAuthors}
              onChange={(e) => setNewAuthors(e.currentTarget.value)}
            />
            <TextField.Root
              placeholder="Publisher"
              value={newPublisher}
              onChange={(e) => setNewPublisher(e.currentTarget.value)}
            />
            <Flex gap="2">
              <TextField.Root
                placeholder="Publication year"
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.currentTarget.value)}
              />
              <TextField.Root
                placeholder="URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.currentTarget.value)}
              />
            </Flex>
          </Flex>
        )}

        <Flex mt="5" justify="end" gap="2">
          <Button variant="soft" onClick={() => modal.hide()}>
            Cancel
          </Button>

          {activeTab === "existing" ? (
            <Button disabled={!canConfirmExisting} onClick={confirmExisting}>
              Confirm
            </Button>
          ) : (
            <Button disabled={!canConfirmNew} onClick={confirmNew}>
              Create and add
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});

// Helper to await a result
export async function pickSource() {
  return new Promise<SourceDTO | null>((resolve) => {
    NiceModal.show(SourcePickerModal, {
      onConfirm: (source) => resolve(source),
    }).then(() => resolve(null));
  });
}
