import NiceModal from "@ebay/nice-modal-react";
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxOption,
} from "../../../../components/inputs/Combobox";
import { createCharacter } from "../../../../lib/serverFns/characters/fns";
import { snakeCase } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";

const groupOptions: ComboboxOption[] = [
  { id: 1, label: "Fungi", hint: "All mushroom characters" },
  { id: 2, label: "Lichens" },
  { id: 3, label: "Yeasts" },
];
const traitSetOptions: ComboboxOption[] = [
  { id: 10, label: "Morphology", hint: "Shape, surface, color" },
  { id: 11, label: "Microscopic", hint: "Spores, basidia" },
  { id: 12, label: "Ecology" },
  { id: 13, label: "Morphology", hint: "Shape, surface, color" },
  { id: 14, label: "Microscopic" },
  { id: 15, label: "Ecology" },
  { id: 16, label: "Morphology", hint: "Shape, surface, color" },
  { id: 17, label: "Microscopic", hint: "Spores, basidia" },
  { id: 18, label: "Ecology", hint: "Habitat, substrate" },
];

export const AddCharacterModal = NiceModal.create(() => {
  const { visible, hide } = NiceModal.useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createCharacter);

  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [autoKey, setAutoKey] = useState(true);

  const [group, setGroup] = useState<ComboboxOption | null>(null);
  const [traitSet, setTraitSet] = useState<ComboboxOption | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    const label = formData.get("label") as string;
    const description = formData.get("description") as string;
    const groupId = Number(formData.get("groupId"));
    const traitSetId = Number(formData.get("traitSetId"));
    const isMultiSelect = formData.get("isMultiSelect") !== null;

    try {
      setLoading(true);
      await serverCreate({
        data: {
          key,
          label,
          description,
          groupId,
          traitSetId,
          isMultiSelect,
        },
      });

      qc.invalidateQueries({ queryKey: ["characters"] });
      toast({
        variant: "success",
        description: `Character "${label}" created successfully.`,
      });
      hide();
    } catch (error) {
      toast({
        variant: "error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setKey(snakeCase(e.target.value));
  };

  // Auto-generate key from label
  useEffect(() => {
    if (autoKey) setKey(snakeCase(label));
  }, [label, autoKey]);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          setLabel("");
          setKey("");
          setAutoKey(true);
          hide();
        }
      }}
    >
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Add character</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Specify the details for the new character.
        </Dialog.Description>
        <Form.Root onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mb="4">
            <Form.Field name="label">
              <Flex justify="between" align="baseline">
                <Text as="div" weight="bold" size="2" mb="1" asChild>
                  <Form.Label>Label</Form.Label>
                </Text>
                <Form.Message match="valueMissing" asChild>
                  <Text color="red" size="1">
                    Label is required
                  </Text>
                </Form.Message>
              </Flex>
              <Form.Control
                required
                asChild
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. cap color, spore diameter"
              >
                <TextField.Root type="text" />
              </Form.Control>
            </Form.Field>
            <Form.Field name="key">
              <Flex justify="between" align="baseline">
                <Text as="div" weight="bold" size="2" mb="1" asChild>
                  <Form.Label>Key</Form.Label>
                </Text>
                <Flex align="baseline" gap="2">
                  <Form.Message match="valueMissing" asChild>
                    <Text color="red" size="1">
                      Key is required
                    </Text>
                  </Form.Message>
                  <Flex align="center" gap="2" mb="1">
                    {autoKey ? (
                      <>
                        <Text size="1" color="gray">
                          Auto
                        </Text>
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => setAutoKey(false)}
                          type="button"
                        >
                          Edit
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="1"
                        variant="soft"
                        onClick={() => setAutoKey(true)}
                        type="button"
                      >
                        Use auto
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Flex>
              <Form.Control
                required
                asChild
                readOnly={autoKey}
                onBlur={handleKeyBlur}
                value={key}
                onChange={(e) => {
                  if (!autoKey) setKey(e.target.value);
                }}
              >
                <TextField.Root type="text" />
              </Form.Control>
            </Form.Field>
            <Flex gap="4">
              {/* Trait Set (required) */}
              <Combobox.Root
                name="traitSetId"
                label="Trait Set"
                value={traitSet}
                onValueChange={setTraitSet}
                options={traitSetOptions}
                onQueryChange={() => {}}
                style={{ width: "50%" }}
              >
                <Combobox.Trigger placeholder="Select a trait set" />
                <Combobox.Content>
                  <Combobox.Input placeholder="Search trait sets..." />
                  <Text size="1" color="gray" style={{ padding: "0 10px 6px" }}>
                    Showing top results
                  </Text>
                  <Combobox.List>
                    {traitSetOptions.map((opt, i) => (
                      <Combobox.Item key={opt.id} option={opt} index={i} />
                    ))}
                  </Combobox.List>
                </Combobox.Content>
              </Combobox.Root>

              {/* Group (required) */}
              <Combobox.Root
                name="groupId"
                label="Select a group"
                value={group}
                onValueChange={setGroup}
                options={groupOptions}
                style={{ width: "50%" }}
              >
                <Combobox.Trigger placeholder="Select a group" />
                <Combobox.Content />
              </Combobox.Root>
            </Flex>
            <Form.Field name="description">
              <Flex justify="between" align="baseline">
                <Text as="div" weight="bold" size="2" mb="1" asChild>
                  <Form.Label>Description</Form.Label>
                </Text>
              </Flex>
              <Form.Control asChild>
                <TextArea />
              </Form.Control>
            </Form.Field>
            <Form.Field name="isMultiSelect">
              <Flex gap="2" align="center">
                <Form.Control asChild>
                  <Checkbox name="isMultiSelect" />
                </Form.Control>
                <Text as="div" weight="bold" size="2" asChild>
                  <Form.Label>Allow multiple selections</Form.Label>
                </Text>
              </Flex>
            </Form.Field>
          </Flex>
          <Flex justify="end" gap="3">
            <Dialog.Close>
              <Button
                type="button"
                disabled={loading}
                loading={loading}
                variant="soft"
                color="gray"
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Form.Submit asChild>
              <Button type="submit" disabled={loading} loading={loading}>
                Add character
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
});
