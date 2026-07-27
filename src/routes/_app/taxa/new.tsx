import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Select,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import {
  Controller,
  type SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { TAXON_RANKS_DESCENDING } from "../../../../db/schema/schema";
import { ContentContainer } from "../../../components/ContentContainer";
import { SelectCombobox } from "../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../components/inputs/ConditionalAlert";
import {
  generateLoginRedirectFromLocation,
  roleHasCuratorRights,
} from "../../../lib/auth/utils";
import {
  type CreateTaxonInput,
  createTaxonSchema,
} from "../../../lib/domain/taxa/validation";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { createTaxonDraftFn } from "../../../lib/server-fns/taxa/createTaxonDraftFn";
import { getErrorMessage } from "../../../lib/utils/getErrorMessage";
import { routeSeo } from "../../../lib/utils/head/routeSeo";
import { toast } from "../../../lib/utils/toast";

export const Route = createFileRoute("/_app/taxa/new")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;
    if (!roleHasCuratorRights(user?.role)) {
      throw generateLoginRedirectFromLocation(location);
    }
  },
  head: ({ match }) =>
    routeSeo({
      title: "Create Taxon Draft | Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const [parentQ, setParentQ] = useState("");
  const serverCreate = useServerFn(createTaxonDraftFn);
  const navigate = useNavigate();

  const { data: parentPaginatedResults } = useQuery(
    taxaQueryOptions(1, 10, {
      q: parentQ,
      status: "active",
    }),
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaxonInput>({
    resolver: zodResolver(createTaxonSchema),
    defaultValues: {
      acceptedName: "",
      parentId: null,
      rank: "species",
    },
  });

  const parentIdVal = useWatch({ control, name: "parentId" });

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      parentPaginatedResults?.items.map((taxon) => ({
        id: taxon.id,
        label: taxon.acceptedName,
      })) ?? [],
    [parentPaginatedResults],
  );

  const parentSelected = useMemo<ComboboxOption | null>(() => {
    if (!parentIdVal) return null;
    return comboboxOptions.find((o) => o.id === Number(parentIdVal)) ?? null;
  }, [parentIdVal, comboboxOptions]);

  const onSubmit: SubmitHandler<CreateTaxonInput> = async ({
    acceptedName,
    rank,
    parentId,
  }) => {
    try {
      const res = await serverCreate({
        data: {
          acceptedName,
          rank,
          parentId,
        },
      });

      navigate({ to: `/taxa/${res.id}/edit` });
      toast({
        description: `Successfully created draft for taxon ${res.acceptedName}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  return (
    <ContentContainer gray>
      <Flex justify="center" mt={{ initial: "4", sm: "6" }}>
        <Box style={{ width: "min(100%, 560px)" }}>
          <Card size="3">
            <Box mb="5">
              <Heading size="6" mb="1">
                Create Taxon Draft
              </Heading>
              <Text as="p" size="2" color="gray">
                Provide the accepted scientific name, rank, and parent taxon.
                You can add morphology and other details on the next screen.
              </Text>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Flex direction="column" gap="5">
                <Box>
                  <Flex justify="between" align="baseline" mb="1">
                    <Label.Root htmlFor="accepted-name">
                      Accepted scientific name
                    </Label.Root>
                    <ConditionalAlert
                      id="accepted-name-error"
                      message={errors.acceptedName?.message}
                    />
                  </Flex>
                  <TextField.Root
                    id="accepted-name"
                    placeholder="e.g. Amanita muscaria"
                    {...register("acceptedName")}
                    {...a11yProps("accepted-name-error", !!errors.acceptedName)}
                  />
                </Box>

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

                <Box>
                  <Flex justify="between" align="baseline" mb="1">
                    <Label.Root htmlFor="parent-id">Parent taxon</Label.Root>
                  </Flex>
                  <Controller
                    name="parentId"
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
                        <SelectCombobox.Trigger placeholder="Search for a parent taxon..." />
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
                  <Text as="p" size="1" color="gray" mt="2">
                    Leave blank to assign the parent later.
                  </Text>
                </Box>

                <Flex justify="between" gap="3" mt="1" align="center">
                  <Button asChild type="button" variant="soft" color="gray">
                    <Link to="/taxa" search={{ status: ["draft"] }}>
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                  >
                    Create draft and continue
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Card>
        </Box>
      </Flex>
    </ContentContainer>
  );
}
