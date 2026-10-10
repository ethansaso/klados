import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { PiImage, PiX } from "react-icons/pi";
import { HUMAN_CASED_MEDIA_LICENSES } from "../../../../db/utils/mediaLicense";
import MediaBrowser from "../../../components/media-browser";
import type { MediaDTO } from "../../../lib/domain/media/types";
import { getMediaUrl } from "../../../lib/storage/getMediaUrl";
import "./-MediaField.css";
import {
  selectWikimediaPhotos,
  WikimediaPhotoSelectModal,
} from "./-WikimediaPhotoSelectModal";

type Props = {
  id?: string;
  value: MediaDTO | null;
  onChange: (media: MediaDTO | null) => void;
  /** Seeds the Wikimedia search. */
  getWikimediaQuery: () => string;
  disabled?: boolean;
};

const THUMB_SIZE = "40px";

export function MediaField({
  id,
  value,
  onChange,
  getWikimediaQuery,
  disabled = false,
}: Props) {
  const handleWikimediaPick = async () => {
    const picked = await selectWikimediaPhotos(getWikimediaQuery());
    const media = picked?.[0];
    if (media) onChange(media);
  };

  const handleBrowserPick = () =>
    NiceModal.show(MediaBrowser, { mode: "single", onSelect: onChange });

  return (
    <Flex align="center" gap="3" p="2" className="media-field">
      {value ? (
        <Box asChild width={THUMB_SIZE} height={THUMB_SIZE} flexShrink="0">
          <img
            src={getMediaUrl(value.storageKey)}
            alt={value.title}
            className="media-field__thumb"
          />
        </Box>
      ) : (
        <Flex
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          flexShrink="0"
          align="center"
          justify="center"
          className="media-field__thumb media-field__thumb--empty"
        >
          <PiImage size="18" />
        </Flex>
      )}

      <Flex direction="column" flexGrow="1" minWidth="0">
        {value ? (
          <>
            <Text size="2" weight="medium" truncate>
              {value.title || "Untitled image"}
            </Text>
            <Text size="1" color="gray" truncate>
              {formatCredit(value)}
            </Text>
          </>
        ) : (
          <Text size="2" color="gray">
            No image
          </Text>
        )}
      </Flex>

      <Flex gap="1" flexShrink="0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger disabled={disabled}>
            <Button
              id={id}
              type="button"
              size="1"
              variant="soft"
              color={value ? "gray" : undefined}
            >
              {value ? "Replace" : "Add"}
              <DropdownMenu.TriggerIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" size="1">
            <DropdownMenu.Item onSelect={handleWikimediaPick}>
              Wikimedia
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleBrowserPick}>
              Browser
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {value && (
          <IconButton
            type="button"
            size="1"
            variant="soft"
            color="gray"
            aria-label="Remove image"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <PiX />
          </IconButton>
        )}
      </Flex>
    </Flex>
  );
}

/** Signals whether to hide a modal hosting a MediaField while a picker is open. */
export function useMediaPickerOpen(): boolean {
  const mediaBrowser = NiceModal.useModal(MediaBrowser);
  const wikimediaPicker = NiceModal.useModal(WikimediaPhotoSelectModal);
  return mediaBrowser.visible || wikimediaPicker.visible;
}

function formatCredit(media: MediaDTO): string {
  const license = HUMAN_CASED_MEDIA_LICENSES[media.license];
  return media.owner ? `${media.owner} · ${license}` : license;
}
