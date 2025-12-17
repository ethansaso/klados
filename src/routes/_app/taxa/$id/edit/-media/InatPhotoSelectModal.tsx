import NiceModal from "@ebay/nice-modal-react";
import {
  Button,
  CheckboxCards,
  Dialog,
  Flex,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import z from "zod";
import { MEDIA_LICENSES } from "../../../../../../db/utils/mediaLicense";
import { MediaItem } from "../../../../../../lib/domain/taxa/validation";

type Props = {
  inatId: number;
  onConfirm: (media: MediaItem[]) => void;
};

const InatTaxaResponseSchema = z.object({
  results: z.array(
    z.object({
      taxon_photos: z
        .array(
          z.object({
            photo: z.object({
              id: z.number(),
              medium_url: z.string(),
              license_code: z.string().nullable(), // iNat: null => ARR
              attribution_name: z.string().nullable(),
            }),
          })
        )
        .optional(),
    })
  ),
});

const ALLOWED_LICENSES = MEDIA_LICENSES.filter(
  (l) => l !== "all-rights-reserved"
) as readonly Exclude<(typeof MEDIA_LICENSES)[number], "all-rights-reserved">[];

const AllowedLicenseSchema = z.enum(ALLOWED_LICENSES);

export const InatPhotoSelectModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, hide } = NiceModal.useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allMedia, setAllMedia] = useState<MediaItem[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
      () => new Set()
    );

    useEffect(() => {
      const controller = new AbortController();

      async function fetchTaxonPhotos() {
        try {
          setLoading(true);
          setError(null);
          setAllMedia(null);
          setSelectedIds(new Set());
          const url = new URL(`https://api.inaturalist.org/v1/taxa/${inatId}`);
          const res = await fetch(url.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          const data: unknown = await res.json();

          const extracted = extractTaxonPhotos(data);
          if (extracted.kind === "invalid") {
            setError(
              "Failed to parse iNaturalist response. Please contact Klados developers."
            );
            return;
          }
          const taxonPhotos = extracted.photos;

          const media: MediaItem[] = taxonPhotos
            .map((tp) => tp.photo)
            .flatMap((p) => {
              const lic = AllowedLicenseSchema.safeParse(p.license_code);
              if (!lic.success) return [];

              return [
                {
                  url: p.medium_url,
                  license: lic.data,
                  owner: p.attribution_name ?? undefined,
                  source: `https://www.inaturalist.org/photos/${p.id}`,
                } satisfies MediaItem,
              ];
            })
            .slice(0, 9);

          setAllMedia(media);
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (!controller.signal.aborted) {
            setError(
              e instanceof Error
                ? e.message
                : "Failed to fetch iNaturalist taxon."
            );
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }

      fetchTaxonPhotos();
      return () => controller.abort();
    }, [inatId]);

    const handleExit = () => {
      setSelectedIds(new Set());
      hide();
    };

    const handleFinish = () => {
      if (!allMedia) return;
      const selectedMedia = allMedia.filter((_, idx) => selectedIds.has(idx));
      onConfirm(selectedMedia);
      handleExit();
    };

    return (
      <Dialog.Root
        open={visible}
        onOpenChange={(open) => !open && handleExit()}
      >
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title>Import iNaturalist Photos</Dialog.Title>
          <Flex justify="center">
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner />
                <Text>Searching for photos...</Text>
              </Flex>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : allMedia ? (
              <CheckboxCards.Root
                columns="3"
                gap="1"
                className="select-image-grid"
                value={Array.from(selectedIds).map(String)}
                onValueChange={(values) =>
                  setSelectedIds(new Set(values.map(Number)))
                }
              >
                {allMedia.length !== 0 ? (
                  allMedia.map((m, i) => (
                    <CheckboxCards.Item value={String(i)} key={m.url}>
                      <img src={m.url} />
                    </CheckboxCards.Item>
                  ))
                ) : (
                  <Text>No photos with usable licenses found.</Text>
                )}
              </CheckboxCards.Root>
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
            <Button disabled={!allMedia} onClick={handleFinish}>
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);

export async function selectInatPhotos(inatId: number) {
  return new Promise<MediaItem[] | null>((resolve) => {
    NiceModal.show(InatPhotoSelectModal, {
      inatId,
      onConfirm: (media) => resolve(media),
    }).then(() => resolve(null));
  });
}

function extractTaxonPhotos(data: unknown) {
  const parsed = InatTaxaResponseSchema.safeParse(data);
  if (!parsed.success) return { kind: "invalid" as const };
  return {
    kind: "ok" as const,
    photos: parsed.data.results[0]?.taxon_photos ?? [],
  };
}
