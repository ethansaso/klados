import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link as RadixLink,
  Select,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Link as TanStackLink,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import { MouseEventHandler, useState } from "react";
import { FaDove, FaLeaf } from "react-icons/fa";
import { TAXON_RANKS_DESCENDING } from "../../../../../db/schema/schema";
import { taxonQueryOptions } from "../../../../../lib/queries/taxa";
import { taxonCharacterValuesQueryOptions } from "../../../../../lib/queries/taxonCharacterValues";
import {
  deleteTaxon,
  publishTaxon,
  updateTaxon,
} from "../../../../../lib/serverFns/taxa/fns";
import { TaxonDTO } from "../../../../../lib/serverFns/taxa/types";
import { MediaItem, TaxonPatch } from "../../../../../lib/serverFns/taxa/zod";
import { toast } from "../../../../../lib/utils/toast";
import { MediaEditingForm } from "./-MediaEditingForm";
import { pickInatTaxon } from "./-dialogs/InatConfirmModal";
import { pickGBIFTaxon } from "./-dialogs/gbifConfirmModal";

type EditState = Omit<TaxonPatch, "media" | "rank"> & {
  media: MediaItem[];
  rank: (typeof TAXON_RANKS_DESCENDING)[number];
};

// TODO: validation
// TODO: suspense
export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  beforeLoad: async ({ context, params }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      throw notFound();
    }

    // ! Forcibly refetch data to ensure we have the latest version to seed form
    await context.queryClient.invalidateQueries(taxonQueryOptions(id));
    await context.queryClient.invalidateQueries(
      taxonCharacterValuesQueryOptions(id)
    );
    const taxon = await context.queryClient.fetchQuery(taxonQueryOptions(id));
    const values = await context.queryClient.fetchQuery(
      taxonCharacterValuesQueryOptions(id)
    );

    if (!taxon || !values) {
      throw notFound();
    }

    return { id, initialTaxon: taxon, initialCharacterValues: values };
  },
  loader: async ({ context, params }) => {
    const { id, initialTaxon, initialCharacterValues } = context;
    return { id, initialTaxon, initialCharacterValues };
  },
  component: RouteComponent,
});

const seedEditState = (taxon: TaxonDTO): EditState => ({
  parent_id: taxon.parentId ?? null,
  rank: taxon.rank,
  source_gbif_id: taxon.sourceGbifId ?? null,
  source_inat_id: taxon.sourceInatId ?? null,
  media: taxon.media ?? [],
  notes: taxon.notes ?? null,
});

function RouteComponent() {
  const { id, initialTaxon, initialCharacterValues } = Route.useLoaderData();
  console.log(initialTaxon.sourceGbifId);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const serverUpdate = useServerFn(updateTaxon);
  const serverPublish = useServerFn(publishTaxon);
  const serverDelete = useServerFn(deleteTaxon);

  const [form, setForm] = useState<EditState>(seedEditState(initialTaxon));

  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);

  useBlocker({
    shouldBlockFn: () =>
      dirty && !pending ? !confirm("Leave without saving?") : false,
    enableBeforeUnload: dirty,
  });

  const isDraft = initialTaxon.status === "draft";
  const statusBadgeColor =
    initialTaxon.status === "active"
      ? "green"
      : initialTaxon.status === "draft"
        ? "yellow"
        : "gray";

  async function invalidateTaxon(id: number) {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["taxon", id] }),
      qc.invalidateQueries({ queryKey: ["taxonCharacterValues", id] }),
      qc.invalidateQueries({ queryKey: ["taxa"] }),
    ]);
  }

  const setField = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscard = () => {
    if (!dirty) return;
    if (!confirm("Discard unsaved changes?")) return;
    setForm(seedEditState(initialTaxon));
    setDirty(false);
  };

  const handleSave: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!dirty) return;
    setPending(true);
    try {
      await serverUpdate({ data: { id, ...form } });
      setDirty(false);
      await invalidateTaxon(id);
      toast({
        description: "Taxon saved.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to save changes.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  const handlePublish: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft) return;

    setPending(true);
    try {
      if (dirty) {
        await serverUpdate({ data: { id, ...form } });
        setDirty(false);
      }
      await serverPublish({ data: { id } });
      await invalidateTaxon(id);
      toast({
        description: "Taxon published.",
        variant: "success",
      });
      navigate({ to: ".." });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to publish taxon.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft) return;
    const ok = window.confirm(
      "Delete this taxon draft? This cannot be undone."
    );
    if (!ok) return;

    setPending(true);
    try {
      await serverDelete({ data: { id } });
      await invalidateTaxon(id);
      navigate({ to: "/taxa/drafts", search: { page: 0, pageSize: 20 } });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to delete taxon.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Box>
      <Box>
        <RadixLink asChild size="2">
          <TanStackLink to="..">Back</TanStackLink>
        </RadixLink>
      </Box>
      <Text size="2">Editing details for:</Text>
      <Heading mb="2">{initialTaxon.acceptedName}</Heading>
      <Flex align="center" gap="2" mb="3">
        <Badge color={statusBadgeColor}>{initialTaxon.status}</Badge>
        <Text size="2">ID: {id}</Text>
      </Flex>

      <Form.Root onSubmit={handleSave}>
        <Box mb="4">
          {/* Accepted Name (TODO) */}
          <Form.Field name="accepted-name" asChild>
            <Box mb="2">
              <Form.Label>Accepted Name</Form.Label>
              <Form.Control asChild>
                <TextField.Root value={"TODO"} onChange={() => {}} />
              </Form.Control>
            </Box>
          </Form.Field>

          {/* Rank */}
          <Form.Field name="rank" asChild>
            <Box mb="2">
              <Form.Label>Rank</Form.Label>
              <Form.Control asChild>
                <Select.Root
                  value={form.rank}
                  onValueChange={(v) => setField("rank", v as typeof form.rank)}
                >
                  <Select.Trigger style={{ display: "flex" }}>
                    {form.rank}
                  </Select.Trigger>
                  <Select.Content>
                    {TAXON_RANKS_DESCENDING.map((rank) => (
                      <Select.Item key={rank} value={rank}>
                        {rank}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Form.Control>
            </Box>
          </Form.Field>
          {/* Parent ID (TODO) */}
          {/* Source GBIF ID */}
          <Form.Field name="source-gbif-id" asChild>
            <Box mb="2">
              <Form.Label>Source GBIF ID</Form.Label>
              <Form.Control asChild>
                <TextField.Root
                  type="number"
                  value={form.source_gbif_id ?? ""}
                  onChange={(e) =>
                    setField(
                      "source_gbif_id",
                      e.currentTarget.value === ""
                        ? null
                        : Number(e.currentTarget.value)
                    )
                  }
                >
                  <TextField.Slot side="right" pr="3">
                    <Tooltip content="Fetch from GBIF">
                      <IconButton
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          const picked = await pickGBIFTaxon(
                            initialTaxon.acceptedName,
                            form.rank
                          );
                          if (picked) {
                            setField("source_gbif_id", picked.id);
                          }
                        }}
                      >
                        <FaLeaf />
                      </IconButton>
                    </Tooltip>
                  </TextField.Slot>
                </TextField.Root>
              </Form.Control>
            </Box>
          </Form.Field>
          {/* Source iNat ID */}
          <Form.Field name="source-inat-id" asChild>
            <Box mb="2">
              <Form.Label>Source iNaturalist ID</Form.Label>
              <Form.Control asChild>
                <TextField.Root
                  type="number"
                  value={form.source_inat_id ?? ""}
                  onChange={(e) =>
                    setField(
                      "source_inat_id",
                      e.currentTarget.value === ""
                        ? null
                        : Number(e.currentTarget.value)
                    )
                  }
                >
                  <TextField.Slot side="right" pr="3">
                    <Tooltip content="Fetch from iNaturalist">
                      <IconButton
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          const picked = await pickInatTaxon(
                            initialTaxon.acceptedName,
                            form.rank
                          );
                          if (picked) {
                            setField("source_inat_id", picked.id);
                          }
                        }}
                      >
                        <FaDove />
                      </IconButton>
                    </Tooltip>
                  </TextField.Slot>
                </TextField.Root>
              </Form.Control>
            </Box>
          </Form.Field>

          {/* Notes (nullable string) */}
          <Form.Field name="notes">
            <Form.Label>Notes</Form.Label>
            <Form.Control asChild>
              <TextArea
                value={form.notes ?? ""}
                onChange={(e) =>
                  setField(
                    "notes",
                    e.currentTarget.value === "" ? null : e.currentTarget.value
                  )
                }
                rows={5}
              />
            </Form.Control>
          </Form.Field>
        </Box>

        {/* Media */}
        <MediaEditingForm
          value={form.media}
          onChange={(media) => setField("media", media)}
        />

        <Flex gap="2" justify="end">
          <Button
            type="button"
            disabled={!dirty || pending}
            loading={pending}
            onClick={handleDiscard}
            variant="soft"
          >
            Discard Changes
          </Button>
          <Form.Submit asChild>
            <Button loading={pending} disabled={!dirty || pending}>
              Save
            </Button>
          </Form.Submit>
          {isDraft ? (
            <Button
              type="button"
              disabled={pending}
              loading={pending}
              onClick={handlePublish}
            >
              Publish
            </Button>
          ) : null}
          {isDraft ? (
            <Button
              type="button"
              disabled={pending}
              loading={pending}
              color="red"
              onClick={handleDelete}
            >
              Delete Draft
            </Button>
          ) : null}
        </Flex>
      </Form.Root>
    </Box>
  );
}
