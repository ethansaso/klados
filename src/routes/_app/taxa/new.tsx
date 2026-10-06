import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Select,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ExGbif } from "../../../components/icons/individual/ExGbif";
import { ExInat } from "../../../components/icons/individual/ExInat";
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
import {
  gbifCandidatesQueryOptions,
  inatCandidatesQueryOptions,
} from "../../../lib/queries/externalTaxa";
import { taxonQueryOptions } from "../../../lib/queries/taxa";
import { createTaxonDraftFn } from "../../../lib/server-fns/taxa/createTaxonDraftFn";
import { formatTaxonName } from "../../../lib/utils/formatting/formatTaxonName";
import { getErrorMessage } from "../../../lib/utils/getErrorMessage";
import { routeSeo } from "../../../lib/utils/head/routeSeo";
import { toast } from "../../../lib/utils/toast";
import { ExternalMatchRow } from "./-components/ExternalMatchRow";
import { ParentTaxonCombobox } from "./-components/ParentTaxonCombobox";
import { importFromInat, type InatImport } from "./-external/importFromInat";
import { useExternalMatch } from "./-hooks/useExternalMatch";

const SUBMIT_LABELS = {
  importing: "Importing from iNaturalist…",
  creating: "Creating draft…",
} as const;

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
  const serverCreate = useServerFn(createTaxonDraftFn);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<keyof typeof SUBMIT_LABELS | null>(null);

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

  const [acceptedName, rank, parentId] = useWatch({
    control,
    name: ["acceptedName", "rank", "parentId"],
  });

  // Ranks external matches, separating homonyms
  const { data: parent } = useQuery({
    ...taxonQueryOptions(parentId ?? 0),
    enabled: parentId !== null,
  });
  const lineage = useMemo(
    () =>
      parent && parentId !== null
        ? [...parent.ancestors, parent].map((t) => t.acceptedName)
        : [],
    [parent, parentId],
  );

  const gbif = useExternalMatch(
    gbifCandidatesQueryOptions,
    acceptedName,
    rank,
    lineage,
  );
  const inat = useExternalMatch(
    inatCandidatesQueryOptions,
    acceptedName,
    rank,
    lineage,
  );
  const matchesSettled = gbif.isSettled && inat.isSettled;

  const onSubmit: SubmitHandler<CreateTaxonInput> = async ({
    acceptedName,
    rank,
    parentId,
  }) => {
    const sourceGbifId = gbif.selected?.id ?? null;
    const sourceInatId = inat.selected?.id ?? null;

    try {
      // A failed import still creates the draft, just without names/media
      let imported: InatImport | null = null;
      let importError: string | null = null;
      if (sourceInatId !== null) {
        setPhase("importing");
        try {
          imported = await importFromInat(sourceInatId);
          qc.invalidateQueries({ queryKey: ["media"] });
        } catch (error) {
          importError = getErrorMessage(error);
        }
      }

      setPhase("creating");
      const res = await serverCreate({
        data: {
          acceptedName,
          rank,
          parentId,
          sourceGbifId,
          sourceInatId,
          names: imported?.names,
          mediaIds: imported?.mediaIds,
        },
      });

      navigate({ to: `/taxa/${res.id}/edit` });
      toast({
        description: `Successfully created draft for ${formatTaxonName(res.rank, res.acceptedName)}${
          imported
            ? `. Imported ${imported.names.length} names and ${imported.mediaIds.length} photos from iNaturalist.`
            : ""
        }`,
        variant: "success",
      });
      if (importError || imported?.failedPhotoCount) {
        toast({
          description: importError
            ? `Couldn't import from iNaturalist: ${importError}`
            : `${imported!.failedPhotoCount} iNaturalist photo(s) couldn't be uploaded.`,
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setPhase(null);
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
                    <ConditionalAlert
                      id="parent-id-error"
                      message={errors.parentId?.message}
                    />
                  </Flex>
                  <Controller
                    name="parentId"
                    control={control}
                    render={({ field }) => (
                      <ParentTaxonCombobox
                        id="parent-id"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search for a parent taxon..."
                        invalid={!!errors.parentId}
                      />
                    )}
                  />
                  <Text as="p" size="1" color="gray" mt="2">
                    Leave blank to assign the parent later.
                  </Text>
                </Box>

                <Box>
                  <Text as="div" mb="1">
                    External sources
                  </Text>
                  <Box
                    style={{
                      border: "1px solid var(--gray-a6)",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <ExternalMatchRow
                      label="GBIF"
                      icon={<ExGbif size={24} color="green" />}
                      match={gbif}
                    />
                    <ExternalMatchRow
                      label="iNaturalist"
                      icon={<ExInat size={16} color="green" />}
                      match={inat}
                    />
                  </Box>
                  <Text as="p" size="1" color="gray" mt="2">
                    Names and photos are imported from the iNaturalist match
                    when the draft is created.
                  </Text>
                </Box>

                <Flex justify="between" gap="3" mt="1" align="center">
                  <Button asChild type="button" variant="soft" color="gray">
                    <Link to="/taxa" search={{ status: ["draft"] }}>
                      Cancel
                    </Link>
                  </Button>
                  {/* Not `loading`, which would hide the phase label */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !matchesSettled}
                  >
                    {phase && <Spinner />}
                    {phase ? SUBMIT_LABELS[phase] : "Create draft and continue"}
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
