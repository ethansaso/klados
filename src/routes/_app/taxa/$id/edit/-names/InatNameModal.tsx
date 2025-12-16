import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Spinner, Table, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";

type InatName = {
  value: string;
  locale: string;
  isPreferred: boolean;
};

type Props = {
  inatId: number;
  onConfirm: (names: InatName[]) => void;
};

export const InatNamesModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, hide } = NiceModal.useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [names, setNames] = useState<InatName[] | null>(null);
    const [selected, setSelected] = useState<Set<number>>(() => new Set());

    useEffect(() => {
      const controller = new AbortController();

      async function fetchNames() {
        try {
          setLoading(true);
          setError(null);
          setNames(null);
          setSelected(new Set());

          const url = new URL(`https://api.inaturalist.org/v1/taxa/${inatId}`);
          // ! Needed to get the "names" array
          url.searchParams.set("all_names", "true");

          const res = await fetch(url.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);

          const data = await res.json();
          const first = data.results?.[0];

          if (!first) {
            setError("No matching taxon found.");
            return;
          }

          const rawNames: any[] = first.names ?? [];
          const mapped = normalizeInatNames(rawNames);

          if (!controller.signal.aborted) {
            setNames(mapped);
            // All checked by default
            setSelected(new Set(mapped.map((_, idx) => idx)));
          }
        } catch (e: any) {
          if (e.name !== "AbortError" && !controller.signal.aborted) {
            setError(e.message ?? "Failed to fetch iNaturalist names.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      fetchNames();
      return () => controller.abort();
    }, [inatId]);

    const handleFinish = () => {
      if (!names) return;
      const selectedNames = names.filter((_, idx) => selected.has(idx));
      onConfirm(selectedNames);
      hide();
    };

    console.log(names);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title>Import iNaturalist Names</Dialog.Title>
          <Flex justify="center">
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner />
                <Text>Searching for common names...</Text>
              </Flex>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : names ? (
              <Table.Root></Table.Root>
            ) : null}
          </Flex>
          <Flex mt="5" justify="end" gap="2">
            <Button
              variant="soft"
              onClick={() => {
                hide();
              }}
            >
              Cancel
            </Button>
            <Button disabled={!names} onClick={handleFinish}>
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);

/** Simple helper which aids in acquiring common names for a given taxon. */
export async function selectInatNames(inatId: number) {
  return new Promise<InatName[] | null>((resolve) => {
    NiceModal.show(InatNamesModal, {
      inatId,
      onConfirm: (names) => resolve(names),
    }).then(() => resolve(null));
  });
}

function normalizeInatNames(rawNames: any[]): InatName[] {
  const seenLocales = new Set<string>();
  const mapped: InatName[] = [];

  // Track sci entries by index, and the first one with is_valid = true
  const sciIndices: number[] = [];
  let sciValidIndex: number | null = null;

  for (const n of rawNames) {
    const nameVal = n.name as string | undefined;
    const locale = n.locale as string | undefined;
    if (!nameVal || !locale) continue;

    // Scientific names marked by iNat API as locale === "sci"
    if (locale === "sci") {
      const index = mapped.length;
      const isValid = Boolean(n.is_valid);

      sciIndices.push(index);
      if (isValid && sciValidIndex === null) {
        sciValidIndex = index;
      }

      mapped.push({
        value: nameVal,
        locale,
        isPreferred: isValid, // provisional; see below
      });
      continue;
    }

    // Common names: first per locale isPreferred = true
    const isFirstForLocale = !seenLocales.has(locale);
    if (isFirstForLocale) {
      seenLocales.add(locale);
    }

    mapped.push({
      value: nameVal,
      locale,
      isPreferred: isFirstForLocale,
    });
  }

  // If any sci names, ensure exactly one preferred.
  if (sciIndices.length > 0) {
    const preferredIndex = sciValidIndex ?? sciIndices[0];

    for (const idx of sciIndices) {
      mapped[idx] = {
        ...mapped[idx],
        isPreferred: idx === preferredIndex,
      };
    }
  }

  return mapped;
}
