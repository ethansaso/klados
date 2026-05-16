import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { PiX } from "react-icons/pi";
import {
  updateFeatureFormSchema,
  type UpdateFeatureFormInput,
} from "../-formValidation";
import { InputCombobox } from "../../../../../components/inputs/combobox/InputCombobox";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import { MediaBrowser } from "../../../../../components/media-browser/MediaBrowser";
import type { FeatureDetailDTO } from "../../../../../lib/domain/features/types";
import type { MediaDTO } from "../../../../../lib/domain/media/types";
import { charactersQueryOptions } from "../../../../../lib/queries/characters";
import {
  featureQueryOptions,
  featuresQueryOptions,
} from "../../../../../lib/queries/features";
import { updateFeatureFn } from "../../../../../lib/server-fns/features/updateFeatureFn";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";
import { toast } from "../../../../../lib/utils/toast";

export const Route = createFileRoute("/_app/glossary/features/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: feature } = useSuspenseQuery(featureQueryOptions(id));

  return <FeatureEditingLayout feature={feature} />;
}

// TODO: We need to enforce cycle detection somewhere.
function FeatureEditingLayout({ feature }: { feature: FeatureDetailDTO }) {
  const serverUpdate = useServerFn(updateFeatureFn);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [parentQuery, setParentQuery] = useState("");
  const [characterQuery, setCharacterQuery] = useState("");
  const [currentMedia, setCurrentMedia] = useState<MediaDTO | null>(
    feature.media ?? null,
  );

  const {
    control,
    register,
    setError,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
  } = useForm<UpdateFeatureFormInput>({
    defaultValues: {
      id: feature.id,
      label: feature.label,
      description: feature.description,
      parent: feature.parentFeature
        ? { id: feature.parentFeature.id, label: feature.parentFeature.label }
        : null,
      characters: feature.characters.map((c) => ({
        id: c.id,
        label: c.label,
      })),
      mediaId: feature.media?.id ?? null,
    },
    resolver: zodResolver(updateFeatureFormSchema),
  });
  const featureId = watch("id");
  const characters = watch("characters");

  useBlocker({
    shouldBlockFn: () =>
      isDirty && !isSubmitting ? !confirm("Leave without saving?") : false,
    enableBeforeUnload: isDirty,
  });

  const mutation = useMutation({
    mutationFn: serverUpdate,
    onSuccess: async (res) => {
      // Invalidate the features list and all affected detail queries.
      const oldParentId = feature.parentFeature?.id;
      const newParentId = res?.parentFeature?.id;
      const idsToInvalidate = [
        res!.id,
        ...(newParentId ? [newParentId] : []),
        ...(oldParentId ? [oldParentId] : []),
        ...feature.subFeatures.map((s) => s.id),
      ];
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["features"] }),
        ...idsToInvalidate.map((id) =>
          qc.invalidateQueries({ queryKey: ["feature", id] }),
        ),
      ]);

      toast({
        variant: "success",
        description: `Feature "${res?.label}" updated successfully.`,
      });
      navigate({
        to: "/glossary/features/$id",
        params: { id: feature.id },
      });
    },
    onError: (err) => {
      setError("root", {
        type: "server",
        message: err.message ?? "Failed to update feature.",
      });
    },
  });

  const onSubmit: SubmitHandler<UpdateFeatureFormInput> = async (data) => {
    const { characters: chars, parent, ...rest } = data;
    await mutation.mutateAsync({
      data: {
        ...rest,
        parentId: parent ? parent.id : null,
        characterIds: chars.map((c) => c.id),
      },
    });
  };

  // ── Parent feature search ───────────────────────────────────────────────
  const { data: parentRes, isFetching: parentLoading } = useQuery(
    featuresQueryOptions(1, 20, {
      q: parentQuery,
    }),
  );
  const parentOptions: ComboboxOption[] = useMemo(() => {
    const items = parentRes?.items ?? [];
    return items
      .filter((p) => p.id !== featureId)
      .map((p) => ({
        id: p.id,
        label: p.label,
        hint: p.description,
      }));
  }, [parentRes, featureId]);

  // ── Character search ───────────────────────────────────────────────
  const { data: characterRes, isFetching: characterLoading } = useQuery(
    charactersQueryOptions(1, 20, { q: characterQuery }),
  );
  const linkedIds = useMemo(
    () => new Set(characters.map((c) => c.id)),
    [characters],
  );
  const characterOptions: ComboboxOption[] = useMemo(() => {
    const items = characterRes?.items ?? [];
    return items
      .filter((c) => !linkedIds.has(c.id))
      .map((c) => ({ id: c.id, label: c.label, hint: c.description }));
  }, [characterRes, linkedIds]);

  const handleAddCharacter = useCallback(
    (opt: ComboboxOption | null) => {
      if (!opt) return;
      if (linkedIds.has(Number(opt.id))) return;
      setValue(
        "characters",
        [...characters, { id: Number(opt.id), label: opt.label }],
        { shouldDirty: true },
      );
    },
    [characters, linkedIds, setValue],
  );

  const handleRemoveCharacter = useCallback(
    (id: number) => {
      setValue(
        "characters",
        characters.filter((c) => c.id !== id),
        { shouldDirty: true },
      );
    },
    [characters, setValue],
  );

  return (
    <Flex asChild direction="column" gap="3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="label">Label</Label.Root>
            <ConditionalAlert
              id="label-error"
              message={errors.label?.message}
            />
          </Flex>
          <TextField.Root
            id="label"
            type="text"
            placeholder="Cap, stipe, gills..."
            {...register("label")}
            {...a11yProps("label-error", !!errors.label)}
          />
        </Box>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="description">Description</Label.Root>
            <ConditionalAlert
              id="description-error"
              message={errors.description?.message}
            />
          </Flex>
          <TextArea
            id="description"
            placeholder="Optional description for this group"
            disabled={mutation.isPending}
            {...register("description")}
            {...a11yProps("description-error", !!errors.description)}
          />
        </Box>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="parent">Parent feature</Label.Root>
            <ConditionalAlert
              id="parent-error"
              message={errors.parent?.message}
            />
          </Flex>
          <Controller
            name="parent"
            control={control}
            render={({ field }) => (
              <SelectCombobox.Root
                id="parent"
                value={field.value}
                onValueChange={(opt) =>
                  field.onChange(
                    opt ? { id: Number(opt.id), label: opt.label } : null,
                  )
                }
                onQueryChange={setParentQuery}
                options={parentOptions}
                loading={parentLoading}
                disabled={mutation.isPending}
              >
                <SelectCombobox.Trigger placeholder="No parent" />
                <SelectCombobox.Content behavior="input" maxWidth="400px">
                  <SelectCombobox.Input placeholder="Search canonical values..." />
                  <SelectCombobox.List>
                    {parentOptions.map((opt, i) => (
                      <SelectCombobox.Item
                        key={String(opt.id)}
                        option={opt}
                        index={i}
                      />
                    ))}
                  </SelectCombobox.List>
                </SelectCombobox.Content>
              </SelectCombobox.Root>
            )}
          />
        </Box>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="characters">Linked characters</Label.Root>
            <ConditionalAlert
              id="characters-error"
              message={errors.characters?.message}
            />
          </Flex>
          <InputCombobox.Root
            id="characters"
            value={null}
            onValueChange={handleAddCharacter}
            onQueryChange={setCharacterQuery}
            options={characterOptions}
            loading={characterLoading}
            disabled={mutation.isPending}
          >
            <InputCombobox.Input placeholder="Search characters to add..." />
            <InputCombobox.Popover>
              <InputCombobox.List>
                {characterOptions.map((opt) => (
                  <InputCombobox.Item key={String(opt.id)} option={opt} />
                ))}
              </InputCombobox.List>
            </InputCombobox.Popover>
          </InputCombobox.Root>
          {characters.length > 0 && (
            <Flex gap="1" wrap="wrap" mt="2">
              {characters.map((c) => (
                <Badge key={c.id} variant="outline" color="gray" asChild>
                  <Flex align="center" gap="2">
                    {c.label}
                    <IconButton
                      type="button"
                      size="1"
                      variant="ghost"
                      color="tomato"
                      onClick={() => handleRemoveCharacter(c.id)}
                      disabled={mutation.isPending}
                      style={{
                        padding: "calc(var(--space-1) / 2)",
                        marginRight: "-3px",
                      }}
                    >
                      <PiX size={12} />
                    </IconButton>
                  </Flex>
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root>Media</Label.Root>
            <Flex gap="2">
              <Button
                type="button"
                radius="full"
                size="1"
                onClick={() =>
                  NiceModal.show(MediaBrowser, {
                    mode: "single",
                    onSelect: (m) => {
                      setValue("mediaId", m.id, { shouldDirty: true });
                      setCurrentMedia(m);
                    },
                  })
                }
              >
                Browser
              </Button>
              {currentMedia && (
                <Button
                  type="button"
                  radius="full"
                  size="1"
                  color="tomato"
                  onClick={() => {
                    setValue("mediaId", null, { shouldDirty: true });
                    setCurrentMedia(null);
                  }}
                >
                  Remove
                </Button>
              )}
            </Flex>
          </Flex>
          {currentMedia && (
            <img
              src={getMediaUrl(currentMedia.storageKey)}
              alt={currentMedia.title}
              style={{
                width: "96px",
                height: "96px",
                objectFit: "cover",
                borderRadius: "var(--radius-2)",
              }}
            />
          )}
        </Box>
        <Flex justify="end" gap="2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: "/glossary/features/$id",
                params: { id: feature.id },
              })
            }
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            loading={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
