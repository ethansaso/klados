import {
  Box,
  Button,
  DataList,
  Flex,
  Grid,
  Heading,
  IconButton,
  Reset,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type React from "react";
import { useRef, useState } from "react";
import {
  PiDownloadSimple,
  PiMagnifyingGlass,
  PiPencil,
  PiTrash,
} from "react-icons/pi";
import type { MediaBrowserProps } from ".";
import type { MediaDTO } from "../../lib/domain/media/types";
import { usePaginatedSearch } from "../../lib/hooks/usePaginatedSearch";
import { mediaQueryOptions } from "../../lib/queries/media";
import { deleteMediaFn } from "../../lib/server-fns/media/deleteMediaFn";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { toast } from "../../lib/utils/toast";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import { DebouncedTextField } from "../inputs/DebouncedTextField";

type Props = MediaBrowserProps & {
  enabled: boolean;
  onClose: () => void;
};

export const MediaBrowserView: React.FC<Props> = (props) => {
  const qc = useQueryClient();
  const serverDelete = useServerFn(deleteMediaFn);
  const { search, setQ, next, prev } = usePaginatedSearch({ pageSize: 30 });
  const { data: mediaItems, isPending } = useQuery({
    ...mediaQueryOptions(search.page, search.pageSize, { q: search.q }),
    placeholderData: keepPreviousData,
  });
  const [selected, setSelected] = useState<MediaDTO[]>([]);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  const viewing = selected[selected.length - 1];
  const maxPages = mediaItems
    ? Math.max(Math.ceil(mediaItems.total / search.pageSize), 1)
    : 1;

  const handleDelete = async (media: MediaDTO) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this media item? This will also remove it from all associated taxa and glossary entries.",
    );
    if (!confirmed) return;

    try {
      await serverDelete({ data: { id: media.id } });
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (error) {
      console.log(error);
      toast({
        variant: "error",
        description: "Failed to delete media item. Please try again.",
      });
    }
  };

  const handleMediaClick = (media: MediaDTO) => {
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
    props.onClose();
  };

  if (!props.enabled) return null;
  return (
    <>
      <SurfaceDialog.Body>
        <SurfaceDialog.Col flexGrow="1">
          <SurfaceDialog.Row overflow="auto" flexShrink="0" p="0">
            <DebouncedTextField
              initialValue={search.q}
              className="search-input"
              variant="soft"
              color="gray"
              radius="none"
              placeholder="Search media..."
              onDebouncedChange={setQ}
            >
              <TextField.Slot side="left">
                <PiMagnifyingGlass />
              </TextField.Slot>
            </DebouncedTextField>
          </SurfaceDialog.Row>
          <SurfaceDialog.Row
            overflow="auto"
            flexGrow="1"
            ref={gridScrollRef}
            px="5"
            py="3"
            style={{ background: "var(--gray-2)" }}
          >
            {isPending ? (
              <Flex
                mt="auto"
                mb="auto"
                align="center"
                justify="center"
                height="100%"
              >
                <Spinner />
              </Flex>
            ) : (
              <Grid columns={{ initial: "2", sm: "3", md: "5" }} gap="2">
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
                            ? "var(--accent-a3)"
                            : "var(--gray-1)",
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
            )}
          </SurfaceDialog.Row>
          <SurfaceDialog.Row p="2">
            <Flex justify="between" align="center" gap="2">
              <Button
                variant="soft"
                size="1"
                onClick={() => {
                  prev();
                  gridScrollRef.current?.scrollTo(0, 0);
                }}
                disabled={search.page <= 1}
              >
                Previous
              </Button>
              <Text size="1" color="gray">
                Page {search.page} of {maxPages}
              </Text>
              <Button
                variant="soft"
                size="1"
                onClick={() => {
                  next(mediaItems?.total || 1);
                  gridScrollRef.current?.scrollTo(0, 0);
                }}
                disabled={search.page >= maxPages}
              >
                Next
              </Button>
            </Flex>
          </SurfaceDialog.Row>
        </SurfaceDialog.Col>
        <SurfaceDialog.Col width="288px" flexShrink="0" flexGrow="0">
          {viewing ? (
            <>
              <SurfaceDialog.Row p="2" flexShrink="0">
                <Flex gap="2" justify="center">
                  <IconButton variant="ghost" size="1">
                    <PiPencil />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="1"
                    onClick={() => handleDelete(viewing)}
                  >
                    <PiTrash />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="1"
                    onClick={() =>
                      window.open(getMediaUrl(viewing.storageKey), "_blank")
                    }
                  >
                    <PiDownloadSimple />
                  </IconButton>
                </Flex>
              </SurfaceDialog.Row>
              <SurfaceDialog.Row flexGrow="1">
                {/* TODO: improve image cropping -- don't want to crop, show border, iNatesque */}
                <Box mb="4">
                  <Heading size="3" as="h3">
                    {viewing.title}
                  </Heading>
                  <Text size="1" color="gray" as="p">
                    {viewing.contentType}
                  </Text>
                </Box>
                <Box>
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
                </Box>
                <DataList.Root mt="4">
                  <DataList.Item>
                    <DataList.Label minWidth="72px">Owner</DataList.Label>
                    <DataList.Value>{viewing.owner}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="72px">License</DataList.Label>
                    <DataList.Value>{viewing.license}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="72px">Source</DataList.Label>
                    <DataList.Value>{viewing.source}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="72px">Uploaded</DataList.Label>
                    <DataList.Value>
                      {new Date(viewing.createdAt).toLocaleString()}
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </SurfaceDialog.Row>
            </>
          ) : (
            <Text mt="auto" mb="auto" align="center">
              Select a media item to see details and actions.
            </Text>
          )}
        </SurfaceDialog.Col>
      </SurfaceDialog.Body>
      <SurfaceDialog.Footer>
        <Flex justify="between" align="center">
          {props.mode === "multi" && (
            <Text size="1" color="gray">
              {selected.length} item{selected.length !== 1 && "s"} selected
            </Text>
          )}
          <Flex gap="2" ml="auto" align="center">
            <Button onClick={props.onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selected.length === 0}>
              Confirm
            </Button>
          </Flex>
        </Flex>
      </SurfaceDialog.Footer>
    </>
  );
};
