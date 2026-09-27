import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type React from "react";
import { useState } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import type {
  MediaDTO,
  UploadedMediaResult,
} from "../../lib/domain/media/types";
import { uploadMediaFn } from "../../lib/server-fns/media/uploadMediaFn";
import { fileToBase64 } from "../../lib/utils/fileToBase64";
import { SUPPORTED_IMAGE_TYPES } from "../../lib/storage/utils";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import { FileUpload } from "../FileUpload";
import {
  emptyMediaMeta,
  MediaMetaFields,
  mediaMetaFormSchema,
  type MediaMetaFormValues,
} from "./MediaMetaFields";

interface Props {
  enabled: boolean;
  onCancel: () => void;
  onUpload: (media: MediaDTO, alreadyExisted: boolean) => void;
}

export const MediaBrowserUpload: React.FC<Props> = (props) => {
  const uploadFn = useServerFn(uploadMediaFn);
  const [file, setFile] = useState<File | null>(null);

  const methods = useForm<MediaMetaFormValues>({
    resolver: zodResolver(mediaMetaFormSchema),
    defaultValues: emptyMediaMeta,
  });
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = methods;

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (
      values: MediaMetaFormValues,
    ): Promise<UploadedMediaResult> => {
      if (!file) throw new Error("No file selected");

      const contentType = z.enum(SUPPORTED_IMAGE_TYPES).safeParse(file.type);
      if (!contentType.success) {
        throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
      }

      const res = await uploadFn({
        data: {
          items: [
            {
              type: "file",
              base64: await fileToBase64(file),
              contentType: contentType.data,
              ...values,
            },
          ],
        },
      });

      const uploaded = res[0];
      if (!uploaded) throw new Error("No media returned from upload");
      return uploaded;
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setError("root", {
        type: "server",
        message: error.message || "Failed to upload media.",
      });
    },
    onSuccess: ({ media, alreadyExisted }) => {
      props.onUpload(media, alreadyExisted);
    },
  });

  const onSubmit: SubmitHandler<MediaMetaFormValues> = async (values) => {
    if (!file) {
      setError("root", {
        type: "validate",
        message: "Please select an image.",
      });
      return;
    }
    await mutateAsync(values);
  };

  if (!props.enabled) return null;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <SurfaceDialog.Body>
          <SurfaceDialog.Col gap="4" p="5" width="100%">
            {errors.root?.message ? (
              <Box>
                <Text size="2" color="tomato" role="alert">
                  {errors.root.message}
                </Text>
              </Box>
            ) : null}
            <FileUpload file={file} onChange={setFile} />
            <MediaMetaFields disabled={isPending} />
          </SurfaceDialog.Col>
        </SurfaceDialog.Body>
        <SurfaceDialog.Footer>
          <Flex justify="end" gap="2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={props.onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} loading={isPending}>
              Upload
            </Button>
          </Flex>
        </SurfaceDialog.Footer>
      </form>
    </FormProvider>
  );
};
