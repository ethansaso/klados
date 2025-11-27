import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Flex,
  Heading,
  Select,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { SelectCombobox } from "../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../components/inputs/ConditionalAlert";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { createTaxonDraft } from "../../../lib/api/taxa/fns/create";
import {
  CreateTaxonInput,
  createTaxonSchema,
} from "../../../lib/api/taxa/validation";
import { getMe } from "../../../lib/api/users/user";
import {
  generateLoginRedirectFromLocation,
  roleHasCuratorRights,
} from "../../../lib/auth/utils";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { toast } from "../../../lib/utils/toast";

export const Route = createFileRoute("/_app/taxa/new")({
  beforeLoad: async ({ location }) => {
    const user = await getMe();
    if (!roleHasCuratorRights(user?.role)) {
      throw generateLoginRedirectFromLocation(location);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [parentQ, setParentQ] = useState("");
  const serverCreate = useServerFn(createTaxonDraft);
  const navigate = useNavigate();

  const { data: parentPaginatedResults } = useQuery(
    taxaQueryOptions(1, 10, {
      q: parentQ,
      status: "active",
    })
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaxonInput>({
    resolver: zodResolver(createTaxonSchema),
    defaultValues: {
      accepted_name: "",
      parent_id: null,
      rank: "species",
    },
  });

  const parentIdVal = useWatch({ control, name: "parent_id" });

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      parentPaginatedResults?.items.map((taxon) => ({
        id: taxon.id,
        label: taxon.acceptedName,
      })) ?? [],
    [parentPaginatedResults]
  );

  const parentSelected = useMemo<ComboboxOption | null>(() => {
    if (!parentIdVal) return null;
    return comboboxOptions.find((o) => o.id === Number(parentIdVal)) ?? null;
  }, [parentIdVal, comboboxOptions]);

  const onSubmit: SubmitHandler<CreateTaxonInput> = async ({
    accepted_name,
    rank,
    parent_id,
  }) => {
    try {
      const res = await serverCreate({
        data: {
          accepted_name,
          rank,
          parent_id: parent_id ?? null,
        },
      });

      navigate({ to: `/taxa/${res.id}/edit` });
      toast({
        description: `Successfully created draft for taxon ${res.acceptedName}`,
        variant: "success",
      });
    } catch (e) {
      toast({
        description:
          e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "error",
      });
    }
  };

  return (
    <Box>
      <Heading mb="4">Add New Taxon</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="4" maxWidth="480px">
          {/* Accepted name */}
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="accepted-name">Accepted name</Label.Root>
              <ConditionalAlert
                id="accepted-name-error"
                message={errors.accepted_name?.message}
              />
            </Flex>
            <TextField.Root
              id="accepted-name"
              placeholder="e.g. Amanita muscaria"
              {...register("accepted_name")}
              {...a11yProps("accepted-name-error", !!errors.accepted_name)}
            />
          </Box>

          {/* Parent taxon (optional) */}
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="parent-id">Parent taxon</Label.Root>
              {/* Optional field, so no error display */}
            </Flex>
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <SelectCombobox.Root
                  id="parent-id"
                  value={parentSelected}
                  onValueChange={(opt) =>
                    field.onChange(opt ? Number(opt.id) : null)
                  }
                  options={comboboxOptions}
                  onQueryChange={setParentQ}
                >
                  <SelectCombobox.Trigger placeholder="Select parent taxon (optional)" />
                  <SelectCombobox.Content>
                    <SelectCombobox.Input placeholder="Search taxa..." />
                    <SelectCombobox.List>
                      {comboboxOptions.map((option, index) => (
                        <SelectCombobox.Item
                          key={option.id}
                          index={index}
                          option={option}
                        />
                      ))}
                    </SelectCombobox.List>
                  </SelectCombobox.Content>
                </SelectCombobox.Root>
              )}
            />
          </Box>

          {/* Rank (required, but starts unset / placeholder) */}
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="rank">Rank</Label.Root>
              <ConditionalAlert
                id="rank-error"
                message={errors.rank?.message}
              />
            </Flex>
            <Controller
              name="rank"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select.Root
                  value={value}
                  onValueChange={(v) => onChange(v as typeof value)}
                >
                  <Select.Trigger style={{ width: "100%" }}>
                    {value || "Select rank"}
                  </Select.Trigger>
                  <Select.Content>
                    {TAXON_RANKS_DESCENDING.map((rank) => (
                      <Select.Item key={rank} value={rank}>
                        {rank}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
          </Box>

          {/* Actions */}
          <Flex justify="end" gap="3">
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Create taxon
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}
