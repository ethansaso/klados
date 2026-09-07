import { Flex, Select, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import type z from "zod";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  MEDIA_LICENSES,
} from "../../../db/utils/mediaLicense";
import { mediaMetaSchema } from "../../lib/domain/media/validation";
import { a11yProps, ConditionalAlert } from "../inputs/ConditionalAlert";

export const mediaMetaFormSchema = mediaMetaSchema;
export type MediaMetaFormValues = z.infer<typeof mediaMetaFormSchema>;

export const emptyMediaMeta: MediaMetaFormValues = {
  title: "",
  owner: "",
  source: "",
  license: "unknown",
};

type Props = {
  disabled?: boolean;
};

export const MediaMetaFields: React.FC<Props> = ({ disabled = false }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<MediaMetaFormValues>();

  const ids = {
    title: "media-meta-title",
    owner: "media-meta-owner",
    source: "media-meta-source",
    license: "media-meta-license",
  };

  return (
    <>
      <Flex direction="column" gap="1">
        <Label.Root htmlFor={ids.title}>Title</Label.Root>
        <TextField.Root
          id={ids.title}
          disabled={disabled}
          {...a11yProps(`${ids.title}-error`, !!errors.title)}
          {...register("title")}
        />
        <ConditionalAlert
          id={`${ids.title}-error`}
          message={errors.title?.message}
        />
      </Flex>
      <Flex direction="column" gap="1">
        <Label.Root htmlFor={ids.owner}>Owner</Label.Root>
        <TextField.Root
          id={ids.owner}
          disabled={disabled}
          {...a11yProps(`${ids.owner}-error`, !!errors.owner)}
          {...register("owner")}
        />
        <ConditionalAlert
          id={`${ids.owner}-error`}
          message={errors.owner?.message}
        />
      </Flex>
      <Flex direction="column" gap="1">
        <Label.Root htmlFor={ids.source}>Source</Label.Root>
        <TextField.Root
          id={ids.source}
          disabled={disabled}
          {...a11yProps(`${ids.source}-error`, !!errors.source)}
          {...register("source")}
        />
        <ConditionalAlert
          id={`${ids.source}-error`}
          message={errors.source?.message}
        />
      </Flex>
      <Flex direction="column" gap="1">
        <Label.Root htmlFor={ids.license}>License</Label.Root>
        <Controller
          control={control}
          name="license"
          render={({ field }) => (
            <Select.Root
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <Select.Trigger id={ids.license} onBlur={field.onBlur} />
              <Select.Content>
                {MEDIA_LICENSES.map((lic) => (
                  <Select.Item key={lic} value={lic}>
                    {HUMAN_CASED_MEDIA_LICENSES[lic]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        />
        <ConditionalAlert
          id={`${ids.license}-error`}
          message={errors.license?.message}
        />
      </Flex>
    </>
  );
};
