import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  Checkbox,
  CheckboxCards,
  Dialog,
  Flex,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import z from "zod";
import {
  MEDIA_LICENSES,
  type MediaLicense,
} from "../../../../../../../db/utils/mediaLicense";
import type { MediaDTO } from "../../../../../../lib/domain/media/types";
import type { UploadMediaWireItem } from "../../../../../../lib/domain/media/validation";
import { uploadMediaFn } from "../../../../../../lib/server-fns/media/uploadMediaFn";

type InatPhoto = {
  url: string;
  license: Exclude<MediaLicense, "all-rights-reserved">;
  owner: string;
  source: string;
  name: string | undefined;
};

type Props = {
  inatId: number;
  onConfirm: (media: MediaDTO[]) => void;
};

const InatTaxaResponseSchema = z.object({
  results: z.array(
    z.object({
      name: z.string().optional(),
      taxon_photos: z
        .array(
          z.object({
            photo: z.object({
              id: z.number(),
              medium_url: z.string(),
              license_code: z.string().nullable(), // iNat: null => ARR
              attribution_name: z.string().nullable(),
            }),
          }),
        )
        .optional(),
    }),
  ),
});

const ALLOWED_LICENSES = MEDIA_LICENSES.filter(
  (l) => l !== "all-rights-reserved",
) as readonly Exclude<MediaLicense, "all-rights-reserved">[];

const AllowedLicenseSchema = z.enum(ALLOWED_LICENSES);

const SELECT_ALL_ID = "inat-select-all";

const InatPhotoSelectModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, hide } = NiceModal.useModal();
    const qc = useQueryClient();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allMedia, setAllMedia] = useState<InatPhoto[] | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
      () => new Set(),
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
              "Failed to parse iNaturalist response. Please contact Klados developers.",
            );
            return;
          }
          const taxonPhotos = extracted.photos;

          const media: InatPhoto[] = taxonPhotos
            .map((tp) => tp.photo)
            .flatMap((p) => {
              const lic = AllowedLicenseSchema.safeParse(p.license_code);
              if (!lic.success) return [];

              return [
                {
                  url: p.medium_url,
                  license: lic.data,
                  owner: p.attribution_name ?? "",
                  source: `https://www.inaturalist.org/photos/${p.id}`,
                  name: extracted.name,
                } satisfies InatPhoto,
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
                : "Failed to fetch iNaturalist taxon.",
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

    const handleFinish = async () => {
      if (!allMedia) return;
      const selectedMedia = allMedia.filter((_, idx) => selectedIds.has(idx));
      if (!selectedMedia.length) return;

      setUploading(true);
      try {
        const items: UploadMediaWireItem[] = selectedMedia.map((m) => ({
          type: "url" as const,
          url: m.url,
          license: m.license,
          owner: m.owner,
          source: m.source,
          title: m.name ?? "Unknown",
        }));

        const uploaded = await uploadMediaFn({ data: { items } });
        onConfirm(uploaded.map((u) => u.media));
        qc.invalidateQueries({ queryKey: ["media"] });
        handleExit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
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
              <Box>
                {allMedia.length !== 0 && (
                  <Flex align="center" justify="between" mb="2">
                    <Flex align="center" gap="2">
                      <Checkbox
                        id={SELECT_ALL_ID}
                        checked={
                          selectedIds.size === 0
                            ? false
                            : selectedIds.size === allMedia.length
                              ? true
                              : "indeterminate"
                        }
                        onCheckedChange={(checked) =>
                          setSelectedIds(
                            checked
                              ? new Set(allMedia.map((_, idx) => idx))
                              : new Set(),
                          )
                        }
                      />
                      <Text
                        as="label"
                        htmlFor={SELECT_ALL_ID}
                        size="2"
                        style={{ userSelect: "none" }}
                      >
                        All
                      </Text>
                    </Flex>
                    <Text size="2" color="gray">
                      {selectedIds.size} of {allMedia.length} selected
                    </Text>
                  </Flex>
                )}
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
              </Box>
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
            <Button
              disabled={!allMedia || uploading || selectedIds.size === 0}
              loading={uploading}
              onClick={handleFinish}
            >
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);

export async function selectInatPhotos(inatId: number) {
  return new Promise<MediaDTO[] | null>((resolve) => {
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
    name: parsed.data.results[0]?.name,
    photos: parsed.data.results[0]?.taxon_photos ?? [],
  };
}
