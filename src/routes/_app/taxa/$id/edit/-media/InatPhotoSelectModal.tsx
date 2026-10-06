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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { MediaDTO } from "../../../../../../lib/domain/media/types";
import { uploadMediaFn } from "../../../../../../lib/server-fns/media/uploadMediaFn";
import { inatTaxonImportQueryOptions } from "../../../../../../lib/queries/externalTaxa";
import { inatPhotoToUploadItem } from "../../../-external/inat";

type Props = {
  inatId: number;
  onConfirm: (media: MediaDTO[]) => void;
};

const SELECT_ALL_ID = "inat-select-all";

const InatPhotoSelectModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, remove } = NiceModal.useModal();
    const qc = useQueryClient();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
      () => new Set(),
    );

    const {
      data,
      isPending: loading,
      error: fetchError,
    } = useQuery(inatTaxonImportQueryOptions(inatId));
    const allMedia = data?.photos ?? null;
    const error = uploadError ?? fetchError?.message ?? null;

    const handleExit = () => {
      setSelectedIds(new Set());
      remove();
    };

    const handleFinish = async () => {
      if (!allMedia) return;
      const selectedMedia = allMedia.filter((_, idx) => selectedIds.has(idx));
      if (!selectedMedia.length) return;

      setUploading(true);
      setUploadError(null);
      try {
        const uploaded = await uploadMediaFn({
          data: { items: selectedMedia.map(inatPhotoToUploadItem) },
        });
        onConfirm(uploaded.map((u) => u.media));
        qc.invalidateQueries({ queryKey: ["media"] });
        handleExit();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed.");
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
                remove();
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
