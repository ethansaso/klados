import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  DataList,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Reset,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PiDownloadSimple, PiMagnifyingGlass, PiPencil } from "react-icons/pi";
import type { MediaDTO } from "../../lib/domain/media/types";
import { usePaginatedSearch } from "../../lib/hooks/usePaginatedSearch";
import { mediaQueryOptions } from "../../lib/queries/media";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { DebouncedTextField } from "../inputs/DebouncedTextField";

type SingleSelectProps = {
  mode: "single";
  onSelect: (media: MediaDTO) => void;
};

type MultiSelectProps = {
  mode: "multi";
  onSelect: (media: MediaDTO[]) => void;
};

type Props = SingleSelectProps | MultiSelectProps;

export const MediaBrowser = NiceModal.create<Props>((props) => {
  const { visible, remove } = NiceModal.useModal();
  const { search, setQ, next, prev } = usePaginatedSearch();
  const { data: mediaItems } = useQuery(
    mediaQueryOptions(search.page, search.pageSize, { q: search.q }),
  );
  const [viewing, setViewing] = useState<MediaDTO | null>(null);
  const [selected, setSelected] = useState<MediaDTO[]>([]);

  const handleMediaClick = (media: MediaDTO) => {
    const alreadySelected = selected.find((m) => m.id === media.id);
    if (!alreadySelected) setViewing(media);
    setSelected((prev) => {
      if (props.mode === "single") return [media];
      if (prev.find((m) => m.id === media.id)) {
        return prev.filter((m) => m.id !== media.id);
      } else {
        return [...prev, media];
      }
    });
  };

  const handleConfirm = () => {
    if (props.mode === "multi") {
      props.onSelect(selected);
    } else {
      const m = selected[0];
      if (!m) return;
      props.onSelect(m);
    }
    remove();
  };

  return (
    <Dialog.Root open={visible} onOpenChange={remove}>
      <Dialog.Content aria-describedby={undefined} maxWidth="800px">
        <Dialog.Title>Browse Media</Dialog.Title>
        <Flex gap="4">
          <Box>
            <DebouncedTextField
              initialValue={search.q}
              placeholder="Search media..."
              mb="2"
              onDebouncedChange={setQ}
            >
              <TextField.Slot side="left">
                <PiMagnifyingGlass />
              </TextField.Slot>
            </DebouncedTextField>
            <Grid columns={{ initial: "2", xs: "3", md: "4", lg: "5" }} gap="2">
              {mediaItems?.items.map((media) => {
                const isSelected = selected.find((m) => m.id === media.id);
                return (
                  <Reset key={media.id}>
                    <button
                      onClick={() => handleMediaClick(media)}
                      style={{
                        border: isSelected
                          ? "1px solid var(--accent-7)"
                          : "1px solid var(--gray-a5)",
                        background: isSelected
                          ? "var(--accent-a2)"
                          : "transparent",
                        cursor: "pointer",
                        paddingInline: 0,
                      }}
                    >
                      <img
                        src={getMediaUrl(media.storageKey)}
                        alt={media.title}
                        style={{
                          display: "block",
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                        }}
                      />
                      <Box p="1">
                        <Text as="p" truncate size="1" align="left">
                          {media.title}
                        </Text>
                      </Box>
                    </button>
                  </Reset>
                );
              })}
            </Grid>
          </Box>
          <Box minWidth="256px">
            {viewing ? (
              <>
                <Flex gap="2" justify="center">
                  <IconButton variant="ghost" size="1">
                    <PiPencil />
                  </IconButton>
                  <IconButton variant="ghost" size="1">
                    <PiDownloadSimple />
                  </IconButton>
                </Flex>
                <Box mt="4">
                  {/* TODO: improve image cropping -- don't want to crop, show border, iNatesque */}
                  <img
                    src={getMediaUrl(viewing.storageKey)}
                    alt={viewing.title}
                    style={{
                      width: "100%",
                      borderRadius: "4px",
                      aspectRatio: "1",
                      objectFit: "cover",
                    }}
                  />
                  <DataList.Root>
                    <DataList.Item>
                      <DataList.Label>Title</DataList.Label>
                      <DataList.Value>{viewing.title}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label>License</DataList.Label>
                      <DataList.Value>{viewing.license}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label>Source</DataList.Label>
                      <DataList.Value>{viewing.source}</DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                </Box>
              </>
            ) : (
              <Text>Select a media item to see details and actions.</Text>
            )}
          </Box>
        </Flex>
        <Flex justify="end" gap="2" mt="4" align="center">
          <Button onClick={remove} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            Confirm
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
