import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Box, Button, Flex, Heading, Separator } from "@radix-ui/themes";
import { Query, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Link as TanStackLink,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
} from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { PiArrowLeft } from "react-icons/pi";
import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { ContentContainer } from "../../../../../components/ContentContainer";
import { TaxonName } from "../../../../../components/TaxonName";
import type { SourceDTO } from "../../../../../lib/domain/sources/types";
import { setTaxonSourcesSchema } from "../../../../../lib/domain/taxon-sources/validation";
import { getTaxonCharacterStatesFn } from "../../../../../lib/server-fns/character-states/getTaxonCharacterStatesFn";
import { deleteTaxonFn } from "../../../../../lib/server-fns/taxa/deleteTaxonFn";
import { getTaxonFn } from "../../../../../lib/server-fns/taxa/getTaxonFn";
import { publishTaxonFn } from "../../../../../lib/server-fns/taxa/publishFn";
import { updateTaxonFn } from "../../../../../lib/server-fns/taxa/updateTaxonFn";
import { getSourcesForTaxonFn } from "../../../../../lib/server-fns/taxon-sources/getSourcesForTaxonFn";
import { formatTaxonName } from "../../../../../lib/utils/formatting/formatTaxonName";
import { getErrorMessage } from "../../../../../lib/utils/getErrorMessage";
import { routeSeo } from "../../../../../lib/utils/head/routeSeo";
import { toast } from "../../../../../lib/utils/toast";
import { EditorActions } from "./-EditorActions";
import { CharacterEditingForm } from "./-characters/CharactersEditingForm";
import type { GroupedCharacterFormValue } from "./-characters/validation";
import { groupedCharacterFormSchema } from "./-characters/validation";
import { MediaEditingForm } from "./-media/MediaEditingForm";
import { mediaFormItemSchema } from "./-media/validation";
import { MetaForm } from "./-meta/MetaForm";
import { NameEditingForm } from "./-names/NameEditingForm";
import { nameItemFormSchema } from "./-names/validation";
import {
  pickDirtySections,
  toUpdatePayload,
  type DirtyTaxonFields,
} from "./-payload";
import { seedTaxonEditState } from "./-seeding";
import { SourceEditingForm } from "./-sources/SourceEditingForm";
import { getCitableSources } from "./-sources/citableSources";
import { TextForm } from "./-text/TextForm";

export type TaxonEditFormValues = z.infer<typeof taxonEditFormSchema>;

export const taxonEditFormSchema = z.object({
  parentId: z.number().nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
  sourceGbifId: z.number().nullable(),
  sourceInatId: z.number().nullable(),
  media: z.array(mediaFormItemSchema),
  ecology: z.string(),
  notes: z.string(),
  names: z.array(nameItemFormSchema),
  states: groupedCharacterFormSchema,
  sources: setTaxonSourcesSchema,
});

export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  beforeLoad: async ({ params: { id } }) => {
    const [taxon, values, sources] = await Promise.all([
      getTaxonFn({ data: { id } }),
      getTaxonCharacterStatesFn({ data: { taxonId: id } }),
      getSourcesForTaxonFn({ data: { id } }),
    ]);

    if (!taxon || !values || !sources) {
      throw notFound();
    }

    return {
      id,
      initialTaxon: taxon,
      initialCharacterValues: values,
      initialSources: sources,
    };
  },
  loader: async ({ context }) => {
    const { id, initialTaxon, initialCharacterValues, initialSources } =
      context;
    return { id, initialTaxon, initialCharacterValues, initialSources };
  },
  head: ({ loaderData, match }) =>
    routeSeo({
      title: loaderData
        ? `Editing ${formatTaxonName(loaderData.initialTaxon.rank, loaderData.initialTaxon.acceptedName)} | Klados`
        : "Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

// TODO: Validation error displays
function RouteComponent() {
  const { id, initialTaxon, initialCharacterValues, initialSources } =
    Route.useLoaderData();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const serverUpdate = useServerFn(updateTaxonFn);
  const serverPublish = useServerFn(publishTaxonFn);
  const serverDelete = useServerFn(deleteTaxonFn);

  const methods = useForm({
    resolver: zodResolver(taxonEditFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: seedTaxonEditState(
      initialTaxon,
      initialCharacterValues,
      initialSources,
    ),
  });
  const { control, handleSubmit, reset } = methods;

  // Render-free live formState snapshot for handlers below: methods.formState
  // only stays fresh for consumers that read it during a render (RHF's proxy
  // only tracks/recomputes fields that were actually accessed while
  // rendering). Reading it lazily inside a callback with nothing else
  // subscribing during render would silently freeze at its initial value.
  const liveFormStateRef = useRef<{
    isDirty: boolean;
    isSubmitting: boolean;
    dirtyFields: DirtyTaxonFields;
  }>({ isDirty: false, isSubmitting: false, dirtyFields: {} });
  useEffect(() => {
    return methods.subscribe({
      formState: { isDirty: true, dirtyFields: true },
      callback: (formState) => {
        liveFormStateRef.current = {
          isDirty: formState.isDirty ?? false,
          isSubmitting: formState.isSubmitting ?? false,
          dirtyFields: formState.dirtyFields ?? {},
        };
      },
    });
  }, [methods]);

  const [isDeleting, setIsDeleting] = useState(false);
  // For media fetching
  const inatId = useWatch({ control, name: "sourceInatId" });

  // Visual mapping for sources editing
  const [sourcesById, setSourcesById] = useState<Map<number, SourceDTO>>(() => {
    const m = new Map<number, SourceDTO>();
    for (const row of initialSources) m.set(row.sourceId, row.source);
    return m;
  });

  const sources = useWatch({ control, name: "sources" });
  const citableSources = useMemo(
    () => getCitableSources(sources, sourcesById),
    [sources, sourcesById],
  );

  const isDraft = initialTaxon.status === "draft";
  const statusBadgeColor =
    initialTaxon.status === "active"
      ? "grass"
      : initialTaxon.status === "draft"
        ? "yellow"
        : "gray";

  async function invalidateTaxon(id: number) {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["taxa"] }),
      // Invalidate all lookalike details involving this taxon
      qc.invalidateQueries({
        predicate: (q: Query) => {
          const key = q.queryKey;
          if (key[0] !== "lookalikeDetails") return false;

          const a = key[1];
          const b = key[2];

          return a === id || b === id;
        },
      }),
    ]);
  }

  const handleDiscard = () => {
    if (!liveFormStateRef.current.isDirty) return;
    if (!confirm("Discard unsaved changes?")) return;
    reset(
      seedTaxonEditState(initialTaxon, initialCharacterValues, initialSources),
      {
        keepDirty: false,
      },
    );
  };

  // Sends only dirty sections, since the server logs each one it receives
  async function saveChanges(data: TaxonEditFormValues) {
    const changed = pickDirtySections(
      toUpdatePayload(data),
      liveFormStateRef.current.dirtyFields,
    );
    if (Object.keys(changed).length > 0) {
      await serverUpdate({ data: { ...changed, id } });
    }
    reset(data, { keepDirty: false }); // keep RHF dirty tracking in sync
  }

  const onSave: SubmitHandler<TaxonEditFormValues> = async (data) => {
    if (!liveFormStateRef.current.isDirty) return;
    try {
      await saveChanges(data);
      await invalidateTaxon(id);
      toast({ description: "Taxon saved.", variant: "success" });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const onPublish: SubmitHandler<TaxonEditFormValues> = async (data) => {
    if (!isDraft) return;
    try {
      await saveChanges(data);
      await serverPublish({ data: { id } });
      await invalidateTaxon(id);
      toast({ description: "Taxon published.", variant: "success" });
      navigate({ to: ".." });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft || isDeleting || liveFormStateRef.current.isSubmitting) return;

    const ok = window.confirm(
      "Delete this taxon draft? This cannot be undone.",
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await serverDelete({ data: { id } });
      await invalidateTaxon(id);
      toast({
        description: `Successfully deleted taxon draft`,
        variant: "success",
      });
      navigate({ to: "/taxa", search: { status: ["draft"] } });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Flex
        className="taxon-editor"
        direction="column"
        height="100%"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="between"
          flexShrink="0"
          px="6"
          py="4"
          style={{
            background: "var(--color-background)",
            boxShadow: "inset 0 -1px 0 0 var(--gray-a5)",
          }}
        >
          <Flex align="center" gap="2">
            <Flex asChild align="center" gap="2">
              <Button asChild variant="ghost" size="2" mr="4">
                <TanStackLink to="..">
                  <PiArrowLeft /> Back
                </TanStackLink>
              </Button>
            </Flex>
            <Heading>
              <TaxonName
                rank={initialTaxon.rank}
                name={initialTaxon.acceptedName}
              />
            </Heading>
            <Badge color={statusBadgeColor} size="2">
              {initialTaxon.status}
            </Badge>
          </Flex>

          <EditorActions
            isDraft={isDraft}
            isDeleting={isDeleting}
            onDiscard={handleDiscard}
            onSave={handleSubmit(onSave)}
            onPublish={handleSubmit(onPublish)}
            onDelete={handleDelete}
          />
        </Flex>
        <Flex
          flexGrow="1"
          flexShrink="1"
          minHeight="0"
          overflow="hidden"
          asChild
        >
          <Form.Root onSubmit={handleSubmit(onSave)} style={{ width: "100%" }}>
            <Box
              flexShrink="0"
              maxWidth="416px"
              p="5"
              overflow="auto"
              style={{
                background: "var(--color-background)",
                borderRight: "1px solid var(--gray-a5)",
              }}
            >
              {/* Basic meta (rank, parent, source IDs) */}
              <MetaForm
                id={id}
                acceptedName={initialTaxon.acceptedName}
                initialParent={initialTaxon.ancestors.at(-1) ?? null}
              />

              <Separator size="4" my="5" />

              {/* Ecology/Notes */}
              <TextForm />

              <Separator size="4" my="5" />

              {/* Media */}
              <MediaEditingForm inatId={inatId} />

              <Separator size="4" my="5" />

              {/* Sources */}
              <Controller
                control={control}
                name="sources"
                render={({ field: { value, onChange } }) => (
                  <SourceEditingForm
                    value={value}
                    sourcesById={sourcesById}
                    setSourcesById={setSourcesById}
                    onChange={onChange}
                  />
                )}
              />

              <Separator size="4" my="5" />

              {/* Names */}
              <Controller
                control={control}
                name="names"
                render={({ field: { onChange } }) => (
                  <NameEditingForm inatId={inatId} onChange={onChange} />
                )}
              />
            </Box>
            <Box flexGrow="1" flexShrink="1" overflow="auto" asChild>
              <ContentContainer align="start" gray>
                {/* Characters */}
                <Controller
                  name="states"
                  control={control}
                  render={({ field }) => (
                    <CharacterEditingForm
                      value={field.value as GroupedCharacterFormValue}
                      citableSources={citableSources}
                      onChange={field.onChange}
                    />
                  )}
                />
              </ContentContainer>
            </Box>
          </Form.Root>
        </Flex>
      </Flex>
    </FormProvider>
  );
}
