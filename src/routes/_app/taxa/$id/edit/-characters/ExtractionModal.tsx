import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Text, TextArea } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CharacterStateDisplay } from "../../../../../../components/state-formatting/CharacterStateDisplay";
import type { UICharacterState } from "../../../../../../components/state-formatting/types";
import type { ExtractionOutput } from "../../../../../../lib/domain/extraction/service";
import { extractStatesFn } from "../../../../../../lib/server-fns/extraction/extractStatesFn";
import type { CharacterStateFormValue } from "./validation";

type Props = {
  onConfirm: (result: ExtractionOutput) => void;
};

function formValueToUIStates(
  char: CharacterStateFormValue,
): UICharacterState[] {
  if (char.kind === "categorical") {
    return [
      { kind: "categorical", trait: char.trait, modifiers: char.modifiers },
    ];
  }
  return [{ ...char, unit: char.unit ?? null }];
}

const ExtractionModal = NiceModal.create<Props>(({ onConfirm }) => {
  const { visible, hide } = NiceModal.useModal();
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<ExtractionOutput | null>(null);
  const serverExtract = useServerFn(extractStatesFn);

  const mutation = useMutation({
    mutationFn: serverExtract,
    onSuccess: (data) => setResult(data),
    onError: (err) => {
      console.error("Extraction failed:", err);
    },
  });

  const handleConfirm = () => {
    if (result) {
      onConfirm(result);
      hide();
    }
  };

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
      <Dialog.Content maxWidth="600px" aria-describedby={undefined}>
        <Dialog.Title>Import Text Description</Dialog.Title>
        <Flex direction="column" gap="3">
          {!result ? (
            <>
              <TextArea
                placeholder="Paste a morphological description..."
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={mutation.isPending}
              />
              <Flex justify="end" gap="2">
                <Dialog.Close>
                  <Button
                    variant="soft"
                    color="gray"
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  disabled={
                    description.trim().length === 0 || mutation.isPending
                  }
                  loading={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      data: { description: description.trim() },
                    })
                  }
                >
                  Extract
                </Button>
              </Flex>
            </>
          ) : (
            <>
              <Flex
                direction="column"
                gap="3"
                style={{ maxHeight: "60vh", overflowY: "auto" }}
              >
                {result.states.map((group) => (
                  <Flex key={group.featureId} direction="column" gap="1">
                    <Text size="2" weight="bold">
                      {group.featureLabel}
                    </Text>
                    {group.characters.map((char) => (
                      <Flex key={char.characterId} gap="2" align="start">
                        <Text size="1" color="gray" style={{ minWidth: 100 }}>
                          {char.characterLabel}
                        </Text>
                        <CharacterStateDisplay
                          states={formValueToUIStates(char)}
                          highlightAffixes
                        />
                      </Flex>
                    ))}
                  </Flex>
                ))}

                {result.glossaryGaps.length > 0 && (
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="bold" color="orange">
                      Glossary Gaps
                    </Text>
                    {result.glossaryGaps.map((entry, i) => (
                      <Text key={i} size="1" color="orange">
                        {entry.text} — {entry.reason}
                      </Text>
                    ))}
                  </Flex>
                )}

                {result.unmatched.length > 0 && (
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="bold" color="red">
                      Unmatched
                    </Text>
                    {result.unmatched.map((entry, i) => (
                      <Text key={i} size="1" color="red">
                        {entry.text} — {entry.reason}
                      </Text>
                    ))}
                  </Flex>
                )}
              </Flex>

              <Flex justify="end" gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setResult(null)}
                >
                  Back
                </Button>
                <Button onClick={handleConfirm}>Accept</Button>
              </Flex>
            </>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});

export async function selectExtraction(): Promise<ExtractionOutput | null> {
  return new Promise<ExtractionOutput | null>((resolve) => {
    NiceModal.show(ExtractionModal, {
      onConfirm: (result: ExtractionOutput) => resolve(result),
    }).then(() => resolve(null));
  });
}
