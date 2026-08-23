import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  Dialog,
  Flex,
  RadioCards,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import z from "zod";
import { type MediaLicense } from "../../../../db/utils/mediaLicense";
import { DebouncedTextField } from "../../../components/inputs/DebouncedTextField";
import type { MediaDTO } from "../../../lib/domain/media/types";
import { uploadMediaFn } from "../../../lib/server-fns/media/uploadMediaFn";

type Props = {
  initialQuery: string;
  onConfirm: (media: MediaDTO[]) => void;
};

type WikimediaPhoto = {
  url: string;
  license: Exclude<MediaLicense, "all-rights-reserved">;
  owner: string;
  source: string;
  title: string;
};

const WikimediaImageInfoResponseSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          title: z.string(),
          imageinfo: z
            .array(
              z.object({
                url: z.string(),
                thumburl: z.string().optional(),
                descriptionurl: z.string().optional(),
                extmetadata: z
                  .object({
                    LicenseShortName: z
                      .object({ value: z.string() })
                      .optional(),
                    Artist: z.object({ value: z.string() }).optional(),
                  })
                  .optional(),
              }),
            )
            .optional(),
        }),
      ),
    })
    .optional(),
});

/** Commons search over a File, narrowed to minimal fields */
const wikimediaPhotosQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["wikimediaPhotos", query] as const,
    queryFn: async ({ signal }): Promise<WikimediaPhoto[]> => {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=20&prop=imageinfo&iiprop=url%7Cextmetadata&iiextmetadatafilter=LicenseShortName%7CArtist&iiurlwidth=400&format=json&origin=*`;

      const res = await fetch(searchUrl, { signal });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data: unknown = await res.json();

      const media = extractWikimediaPhotos(data);
      if (media === null) {
        throw new Error(
          "Failed to parse Wikimedia response. Please contact Klados developers.",
        );
      }

      return media;
    },
  });

export const WikimediaPhotoSelectModal = NiceModal.create<Props>(
  ({ initialQuery, onConfirm }) => {
    const { visible, remove } = NiceModal.useModal();
    const qc = useQueryClient();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    // Keyed by url, not index, so a stale pick simply matches nothing new
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [query, setQuery] = useState(initialQuery);
    const upload = useServerFn(uploadMediaFn);

    const {
      data: allMedia,
      isPending: loading,
      error: searchError,
    } = useQuery({
      ...wikimediaPhotosQueryOptions(query),
      enabled: visible,
    });

    const error = uploadError ?? searchError?.message ?? null;

    const handleExit = () => {
      setSelectedUrl(null);
      remove();
    };

    const handleFinish = async () => {
      const selectedMedia = allMedia?.find((m) => m.url === selectedUrl);
      if (!selectedMedia) return;

      setUploading(true);
      setUploadError(null);
      try {
        const items = [
          {
            type: "url" as const,
            url: selectedMedia.url,
            license: selectedMedia.license,
            owner: selectedMedia.owner,
            source: selectedMedia.source,
            title: selectedMedia.title,
          },
        ];

        const uploaded = await upload({ data: { items } });
        onConfirm(uploaded);
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
          <Dialog.Title>Import Wikimedia Photos</Dialog.Title>
          <DebouncedTextField
            initialValue={initialQuery}
            onDebouncedChange={setQuery}
            placeholder="Search Wikimedia Commons…"
            mb="3"
          />
          <Flex justify="center">
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner />
                <Text>Searching for photos...</Text>
              </Flex>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : allMedia?.length === 0 ? (
              <Text color="gray">No photos with usable licenses found.</Text>
            ) : allMedia ? (
              <Box>
                <RadioCards.Root
                  columns="3"
                  gap="1"
                  className="select-image-grid"
                  value={selectedUrl ?? ""}
                  onValueChange={(value) => setSelectedUrl(value || null)}
                >
                  {allMedia.map((m) => (
                    <RadioCards.Item value={m.url} key={m.url}>
                      <img src={m.url} />
                    </RadioCards.Item>
                  ))}
                </RadioCards.Root>
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
              disabled={!allMedia || uploading || selectedUrl === null}
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

export async function selectWikimediaPhotos(initialQuery: string) {
  return new Promise<MediaDTO[] | null>((resolve) => {
    NiceModal.show(WikimediaPhotoSelectModal, {
      initialQuery,
      onConfirm: (media) => resolve(media),
    }).then(() => resolve(null));
  });
}

function parseArtistHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Prefer the text of the first anchor (usually the actual author name)
  const firstLink = doc.querySelector("a");
  if (firstLink?.textContent?.trim()) return firstLink.textContent.trim();
  return doc.body.textContent?.trim() ?? "";
}

function parseWikimediaLicense(
  shortName: string,
): Exclude<MediaLicense, "all-rights-reserved"> | null {
  const s = shortName.toLowerCase().trim();
  if (s === "cc0" || s.startsWith("public domain") || s === "pd") return "cc0";
  if (s.startsWith("cc by-nc-nd")) return "cc-by-nc-nd";
  if (s.startsWith("cc by-nc-sa")) return "cc-by-nc-sa";
  if (s.startsWith("cc by-nc")) return "cc-by-nc";
  if (s.startsWith("cc by-nd")) return "cc-by-nd";
  if (s.startsWith("cc by-sa")) return "cc-by-sa";
  if (s.startsWith("cc by")) return "cc-by";
  return null;
}

function extractWikimediaPhotos(data: unknown): WikimediaPhoto[] | null {
  const parsed = WikimediaImageInfoResponseSchema.safeParse(data);
  if (!parsed.success) return null;
  if (!parsed.data.query) return [];

  return Object.values(parsed.data.query.pages)
    .flatMap((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return [];
      const licenseShortName = info.extmetadata?.LicenseShortName?.value ?? "";
      const license = parseWikimediaLicense(licenseShortName);
      if (!license) return [];
      const owner = parseArtistHtml(info.extmetadata?.Artist?.value ?? "");
      return [
        {
          url: info.thumburl ?? info.url,
          license,
          owner,
          source: info.descriptionurl ?? info.url,
          title: page.title
            .replace(/^File:/i, "")
            .replace(/\.[^.]+$/, "")
            .trim(),
        } satisfies WikimediaPhoto,
      ];
    })
    .slice(0, 9);
}
