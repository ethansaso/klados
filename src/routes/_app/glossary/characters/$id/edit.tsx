import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import {
  useMutation,
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
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import {
  generateLoginRedirectFromLocation,
  roleHasCuratorRights,
} from "../../../../../lib/auth/utils";
import {
  updateCharacterSchema,
  type UpdateCharacterInput,
} from "../../../../../lib/domain/characters/validation";
import { characterQueryOptions } from "../../../../../lib/queries/characters";
import { updateCharacterFn } from "../../../../../lib/server-fns/characters/updateCharacterFn";
import { capitalizeFirstLetter } from "../../../../../lib/utils/formatting/casing";
import { toast } from "../../../../../lib/utils/toast";

export const Route = createFileRoute("/_app/glossary/characters/$id/edit")({
  beforeLoad: ({ context, location }) => {
    if (!roleHasCuratorRights(context.user?.role)) {
      throw generateLoginRedirectFromLocation(location);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: character } = useSuspenseQuery(characterQueryOptions(id));
  const serverUpdate = useServerFn(updateCharacterFn);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const {
    control,
    register,
    setError,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
  } = useForm({
    defaultValues: {
      id: character.id,
      label: character.label,
      description: character.description,
      isMultiSelect:
        character.type === "categorical" ? character.isMultiSelect : undefined,
    },
    resolver: zodResolver(updateCharacterSchema),
  });

  useBlocker({
    shouldBlockFn: () =>
      isDirty && !isSubmitting ? !confirm("Leave without saving?") : false,
    enableBeforeUnload: isDirty,
  });

  const mutation = useMutation({
    mutationFn: serverUpdate,
    onSuccess: async (res) => {
      if (!res) return;
      await qc.invalidateQueries({ queryKey: ["character", res.id] });
      await qc.invalidateQueries({ queryKey: ["characters"] });

      toast({
        variant: "success",
        description: `Character "${res.label}" updated successfully.`,
      });
      navigate({
        to: "/glossary/characters/$id",
        params: { id: character.id },
      });
    },
    onError: (err) => {
      setError("root", {
        type: "server",
        message: err.message ?? "Failed to update character.",
      });
    },
  });

  const onSubmit: SubmitHandler<UpdateCharacterInput> = async (data) => {
    await mutation.mutateAsync({ data });
  };

  return (
    <Flex asChild direction="column" gap="3">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Heading>
          Editing {capitalizeFirstLetter(character.type)} Character
        </Heading>

        {/* Label */}
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
            placeholder="e.g. Cap Color"
            disabled={mutation.isPending}
            {...register("label")}
            {...a11yProps("label-error", !!errors.label)}
          />
        </Box>

        {/* Description */}
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
            placeholder="Optional description for this character"
            disabled={mutation.isPending}
            {...register("description")}
            {...a11yProps("description-error", !!errors.description)}
          />
        </Box>

        {/* isMultiSelect (categorical only) */}
        {character.type === "categorical" && (
          <Box>
            <Controller
              name="isMultiSelect"
              control={control}
              render={({ field }) => (
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      disabled={mutation.isPending}
                    />
                    Allow multiple selections per taxon
                  </Flex>
                </Text>
              )}
            />
          </Box>
        )}

        {/* Root error */}
        {errors.root && (
          <Text size="2" color="red">
            {errors.root.message}
          </Text>
        )}

        {/* Actions */}
        <Flex justify="end" gap="2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: "/glossary/characters/$id",
                params: { id: character.id },
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
