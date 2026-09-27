import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type React from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import type { MediaDTO } from "../../lib/domain/media/types";
import { updateMediaFn } from "../../lib/server-fns/media/updateMediaFn";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import {
  MediaMetaFields,
  mediaMetaFormSchema,
  type MediaMetaFormValues,
} from "./MediaMetaFields";

interface Props {
  enabled: boolean;
  media: MediaDTO;
  onCancel: () => void;
  onSaved: (media: MediaDTO) => void;
}

export const MediaBrowserEdit: React.FC<Props> = ({
  enabled,
  media,
  onCancel,
  onSaved,
}) => {
  const qc = useQueryClient();
  const serverUpdate = useServerFn(updateMediaFn);

  const methods = useForm<MediaMetaFormValues>({
    resolver: zodResolver(mediaMetaFormSchema),
    defaultValues: {
      title: media.title,
      owner: media.owner,
      source: media.source,
      license: media.license,
    },
  });
  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = methods;

  const { isPending, mutateAsync } = useMutation({
    mutationFn: (values: MediaMetaFormValues) =>
      serverUpdate({ data: { id: media.id, ...values } }),
    onError: (error) => {
      console.error("Media update error:", error);
      setError("root", {
        type: "server",
        message: error.message || "Failed to update media.",
      });
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["media"] });
      onSaved(updated);
    },
  });

  const onSubmit: SubmitHandler<MediaMetaFormValues> = async (values) => {
    await mutateAsync(values);
  };

  if (!enabled) return null;

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
            <Flex gap="3" align="center">
              <img
                src={getMediaUrl(media.storageKey)}
                alt={media.title}
                style={{
                  width: "64px",
                  height: "64px",
                  objectFit: "cover",
                  borderRadius: "var(--radius-2)",
                  flexShrink: 0,
                }}
              />
              <Text size="1" color="gray">
                The image file itself can't be changed. Edits apply everywhere
                this image is used.
              </Text>
            </Flex>
            <MediaMetaFields disabled={isPending} />
          </SurfaceDialog.Col>
        </SurfaceDialog.Body>
        <SurfaceDialog.Footer>
          <Flex justify="end" gap="2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} loading={isPending}>
              Save
            </Button>
          </Flex>
        </SurfaceDialog.Footer>
      </form>
    </FormProvider>
  );
};
