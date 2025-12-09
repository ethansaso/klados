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
import { MEDIA_LICENSES } from "../../../../../../db/utils/mediaLicense";
import { MediaItem } from "../../../../../../lib/domain/taxa/validation";

type Props = {
  inatId: number;
  onConfirm: (media: MediaItem[]) => void;
};

// copilot: make a subset of the type of MEDIA_LICENSES w/o 'all-rights-reserved'
const ALLOWED_LICENSES = MEDIA_LICENSES.filter(
  (license) => license !== "all-rights-reserved"
);

export const InatPhotoSelectModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, hide } = NiceModal.useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allMedia, setAllMedia] = useState<MediaItem[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
          const data = await res.json();
          const first = data.results?.[0];
          if (!first) {
            setError("No matching taxon found.");
          } else {
            // first 9 photos
            const taxonPhotos: any[] =
              first.taxon_photos
                ?.filter((tp) =>
                  ALLOWED_LICENSES.includes(tp.photo.license_code)
                ) // filter out all rights reserved
                .slice(0, 9) ?? [];
            setAllMedia(
              taxonPhotos.map(
                (tp) =>
                  ({
                    url: tp.photo.medium_url,
                    license: tp.photo.license_code,
                    owner: tp.photo.attribution_name,
                    source: `https://www.inaturalist.org/photos/${tp.photo.id}`,
                  }) as MediaItem
              )
            );
          }
        } catch (e: any) {
          if (e.name !== "AbortError") {
            if (!controller.signal.aborted)
              setError(e.message ?? "Failed to fetch iNaturalist taxon.");
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
                    <CheckboxCards.Item value={String(i)} key={i}>
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
