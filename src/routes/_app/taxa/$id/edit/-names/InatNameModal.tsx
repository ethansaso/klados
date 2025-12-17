import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Spinner, Table, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import z from "zod";

type InatRawName = z.infer<typeof InatRawNameSchema>;

type NormalizedInatName = {
  value: string;
  locale: string;
  isPreferred: boolean;
};

type Props = {
  inatId: number;
  onConfirm: (names: NormalizedInatName[]) => void;
};

const InatRawNameSchema = z.object({
  name: z.string(),
  locale: z.string(),
  is_valid: z.boolean().optional(),
});

const InatNamesArraySchema = z.array(InatRawNameSchema);

const InatResponseSchema = z.object({
  results: z
    .array(z.object({ names: InatNamesArraySchema.optional() }))
    .optional(),
});

export const InatNamesModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, hide } = NiceModal.useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [names, setNames] = useState<NormalizedInatName[] | null>(null);
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
          const rawNames = extractInatNames(data);
          const mapped = normalizeInatNames(rawNames);

          if (!controller.signal.aborted) {
            setNames(mapped);
            // All checked by default
            setSelected(new Set(mapped.map((_, idx) => idx)));
          }
        } catch (e) {
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
  return new Promise<NormalizedInatName[] | null>((resolve) => {
    NiceModal.show(InatNamesModal, {
      inatId,
      onConfirm: (names) => resolve(names),
    }).then(() => resolve(null));
  });
}

function extractInatNames(data: unknown) {
  const parsed = InatResponseSchema.safeParse(data);
  return parsed.success ? (parsed.data.results?.[0]?.names ?? []) : [];
}

function normalizeInatNames(rawNames: InatRawName[]): NormalizedInatName[] {
  const seenLocales = new Set<string>();

  // Find preferred scientific name: first is_valid sci, else first sci.
  const preferredSci =
    rawNames.find((n) => n.locale === "sci" && n.is_valid)?.name ??
    rawNames.find((n) => n.locale === "sci")?.name ??
    null;

  return rawNames.flatMap((n) => {
    const { name, locale } = n;
    if (!name || !locale) return [];

    if (locale === "sci") {
      return [
        {
          value: name,
          locale,
          isPreferred: preferredSci === name,
        },
      ];
    }

    const isPreferred = !seenLocales.has(locale);
    seenLocales.add(locale);

    return [
      {
        value: name,
        locale,
        isPreferred,
      },
    ];
  });
}
