import { Box, Flex, IconButton, Strong, Table, Text } from "@radix-ui/themes";
import { FaDove } from "react-icons/fa";
import { PiPlus } from "react-icons/pi";
import { localeDisplayValues } from "../../../../../lib/consts/locale-display-values";
import { NameItem } from "../../../../../lib/serverFns/taxon-names/validation";
import { toast } from "../../../../../lib/utils/toast";
import { selectInatNames } from "./-dialogs/InatNameModal";

type NameEditorProps = {
  value: NameItem[];
  inatId: number | null;
  onChange: (next: NameItem[]) => void;
};

export const NameEditingForm = ({
  value,
  inatId,
  onChange,
}: NameEditorProps) => {
  const addRow = () =>
    onChange([...value, { locale: "", value: "", isPreferred: false }]);
  // const setCell = <K extends keyof MediaItem>(
  //   i: number,
  //   key: K,
  //   val: MediaItem[K]
  // ) => {
  //   const next = [...value];
  //   next[i] = { ...next[i], [key]: val };
  //   onChange(next);
  // };

  const setFromInat = async () => {
    if (!inatId) {
      toast({
        variant: "error",
        description: "Please set the iNaturalist ID first.",
      });
      return;
    }
    const picked = await selectInatNames(inatId);
    if (picked && picked.length) {
      onChange(picked);
    }
  };

  /** Reordered table data which places scientific names first */
  const sciPrefixedNames = [...value].sort((a, b) => {
    const aIsSci = a.locale === "sci" ? 1 : 0;
    const bIsSci = b.locale === "sci" ? 1 : 0;
    return bIsSci - aIsSci;
  });

  return (
    <Box mb="4">
      <Flex mb="2" gap="1">
        <Text size="3" mr="1">
          <Strong>Names</Strong>
        </Text>
        <IconButton type="button" radius="full" size="1" onClick={addRow}>
          <PiPlus size="16" />
        </IconButton>
        <IconButton
          type="button"
          radius="full"
          size="1"
          color="grass"
          onClick={setFromInat}
        >
          <FaDove size="16" />
        </IconButton>
      </Flex>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Kind / Locale</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Preferred</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sciPrefixedNames.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                <Text color="gray">
                  No names added yet. Use the + button to add.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            sciPrefixedNames.map((m, i) => {
              return (
                <Table.Row key={i}>
                  <Table.RowHeaderCell>
                    {localeDisplayValues[m.locale] ?? m.locale}
                  </Table.RowHeaderCell>
                  <Table.Cell>{m.isPreferred ? "✓" : ""}</Table.Cell>
                  <Table.Cell>{m.value}</Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
