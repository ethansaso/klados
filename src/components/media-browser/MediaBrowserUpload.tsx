import { Button, Flex, Select, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import type React from "react";
import { useState } from "react";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  MEDIA_LICENSES,
  type MediaLicense,
} from "../../../db/utils/mediaLicense";
import type { MediaDTO } from "../../lib/domain/media/types";
import { uploadMediaFn } from "../../lib/server-fns/media/uploadMediaFn";
import { toast } from "../../lib/utils/toast";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import { FileUpload } from "../FileUpload";

interface Props {
  enabled: boolean;
  onCancel: () => void;
  onUpload: (media: MediaDTO) => void;
}

// TODO: use RHF w/ errors
export const MediaBrowserUpload: React.FC<Props> = (props) => {
  const uploadFn = useServerFn(uploadMediaFn);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [license, setLicense] = useState<MediaLicense>("unknown");

  const { mutate } = useMutation({
    mutationFn: async (): Promise<MediaDTO> => {
      if (!file) throw new Error("No file selected");

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // readAsDataURL produces "data:<type>;base64,<data>" — strip the prefix
          resolve(dataUrl.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const contentType = file.type as
        | "image/avif"
        | "image/gif"
        | "image/jpeg"
        | "image/png"
        | "image/svg+xml"
        | "image/webp";

      const mediaRes = await uploadFn({
        data: {
          items: [
            {
              type: "file",
              base64,
              contentType,
              title,
              owner,
              source,
              license,
            },
          ],
        },
      });

      const media = mediaRes[0];
      if (!media) throw new Error("No media returned from upload");
      return media;
    },
    onError: (error) => {
      toast({ variant: "error", description: "Failed to upload media" });
      console.error("Upload error:", error);
    },
    onSuccess: (media: MediaDTO) => {
      props.onUpload(media);
    },
  });

  if (!props.enabled) return null;

  return (
    <>
      <SurfaceDialog.Body>
        <SurfaceDialog.Col gap="4" p="5" width="100%">
          <FileUpload file={file} onChange={setFile} />
          <Flex direction="column" gap="1">
            <Label.Root htmlFor="title-input">Title</Label.Root>
            <TextField.Root
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Flex>
          <Flex direction="column" gap="1">
            <Label.Root htmlFor="owner-input">Owner</Label.Root>
            <TextField.Root
              id="owner-input"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </Flex>
          <Flex direction="column" gap="1">
            <Label.Root htmlFor="source-input">Source</Label.Root>
            <TextField.Root
              id="source-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </Flex>
          <Flex direction="column" gap="1">
            <Label.Root htmlFor="license-input">License</Label.Root>
            <Select.Root
              value={license}
              onValueChange={(v) => setLicense(v as MediaLicense)}
            >
              <Select.Trigger id="license-input" />
              <Select.Content>
                {MEDIA_LICENSES.map((lic) => (
                  <Select.Item key={lic} value={lic}>
                    {HUMAN_CASED_MEDIA_LICENSES[lic]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        </SurfaceDialog.Col>
      </SurfaceDialog.Body>
      <SurfaceDialog.Footer>
        <Flex justify="end" gap="2">
          <Button variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button onClick={() => mutate()}>Upload</Button>
        </Flex>
      </SurfaceDialog.Footer>
    </>
  );
};
