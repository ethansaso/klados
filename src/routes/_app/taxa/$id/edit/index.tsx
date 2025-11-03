import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
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
import { MediaItem, TaxonPatch } from "../../../../../lib/serverFns/taxa/zod";
import { MediaEditingForm } from "./-MediaEditingForm";
import { pickInatTaxon } from "./-dialogs/InatConfirmModal";

type EditState = Omit<TaxonPatch, "media"> & { media: MediaItem[] };

export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  loader: async ({ context, params }) => {
    const numericId = Number(params.id);

    const originalTaxon = await context.queryClient.fetchQuery(
      taxonQueryOptions(numericId)
    );
    const originalCharacterValues = await context.queryClient.fetchQuery(
      taxonCharacterValuesQueryOptions(numericId)
    );

    if (!originalTaxon || !originalCharacterValues) {
      throw notFound();
    }

    return { id: numericId, originalTaxon, originalCharacterValues };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, originalTaxon } = Route.useLoaderData();
  const navigate = useNavigate();

  const serverUpdate = useServerFn(updateTaxon);
  const serverPublish = useServerFn(publishTaxon);
  const serverDelete = useServerFn(deleteTaxon);

  const [form, setForm] = useState<EditState>({
    parent_id: originalTaxon.parentId ?? null,
    rank: originalTaxon.rank,
    source_gbif_id: originalTaxon.sourceGbifId ?? null,
    source_inat_id: originalTaxon.sourceInatId ?? null,
    media: originalTaxon.media ?? [],
    notes: originalTaxon.notes ?? null,
  });

  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = originalTaxon.status === "draft";
  const statusBadgeColor =
    originalTaxon.status === "active"
      ? "green"
      : originalTaxon.status === "draft"
        ? "yellow"
        : "gray";

  const setField = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!dirty) return;

    setPending(true);
    setError(null);
    try {
      await serverUpdate({ data: { id, ...form } });
      setDirty(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save changes.");
    } finally {
      setPending(false);
    }
  };

  const handlePublish: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft) return;

    setPending(true);
    setError(null);
    try {
      if (dirty) {
        await serverUpdate({ data: { id, ...form } });
        setDirty(false);
      }
      await serverPublish({ data: { id } });
      navigate({ to: ".." });
    } catch (err: any) {
      setError(err?.message ?? "Failed to publish taxon.");
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
    setError(null);
    try {
      await serverDelete({ data: { id } });
      navigate({ to: "/taxa/drafts" });
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete taxon.");
    } finally {
      setPending(false);
    }
  };

  // https://api.gbif.org/v1/species?name=${taxon.taxon_name}&limit=1&offset=0
  // https://api.inaturalist.org/v1/taxa?q=${taxon.taxon_name}

  // TODO: sort out use of form elements (form.control?) and form wrapping maybe unused elements
  return (
    <Box>
      <small>Editing details for:</small>
      <Heading mb="2">{originalTaxon.acceptedName}</Heading>
      <Flex align="center" gap="2" mb="3">
        <Badge color={statusBadgeColor}>{originalTaxon.status}</Badge>
        <Text size="2">ID: {id}</Text>
      </Flex>

      {error ? (
        <Box
          mb="3"
          p="2"
          style={{ border: "1px solid var(--red-7)", borderRadius: 6 }}
        >
          <Text color="red">{error}</Text>
        </Box>
      ) : null}

      <Form.Root
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
                <Select.Root value={form.rank} onValueChange={() => {}}>
                  <Select.Trigger style={{ display: "flex" }} />
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
                    <IconButton variant="ghost">
                      <FaLeaf />
                    </IconButton>
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
                    <IconButton
                      variant="ghost"
                      title="TODO tooltip"
                      onClick={async () => {
                        const picked = await pickInatTaxon(
                          originalTaxon.acceptedName,
                          form.rank
                        );
                        if (picked) {
                          setField("source_inat_id", picked.id);
                        }
                      }}
                    >
                      <FaDove />
                    </IconButton>
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
          <Button type="button" onClick={() => {}} variant="soft">
            Discard Changes
          </Button>
          <Button type="button" onClick={handleSaveDraft}>
            Save
          </Button>
          {isDraft ? (
            <Button type="button" color="green" onClick={handlePublish}>
              Publish
            </Button>
          ) : null}
          {isDraft ? (
            <Button type="button" color="red" onClick={handleDelete}>
              Delete Draft
            </Button>
          ) : null}
        </Flex>
      </Form.Root>
    </Box>
  );
}
