import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import { FormEventHandler, MouseEventHandler, useState } from "react";
import { roleHasCuratorRights } from "../../../../../lib/auth/utils";
import { taxonQueryOptions } from "../../../../../lib/queries/taxa";
import { taxonCharacterValuesQueryOptions } from "../../../../../lib/queries/taxonCharacterValues";
import { updateTaxon } from "../../../../../lib/serverFns/taxa";
import { getMe } from "../../../../../lib/serverFns/user";

export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  beforeLoad: async ({ location }) => {
    const user = await getMe();
    if (!roleHasCuratorRights(user?.role)) {
      throw redirect({ to: "/login" });
    }
    return {
      user,
    };
  },
  loader: async ({ context, params }) => {
    const numericId = Number(params.id);
    await context.queryClient.ensureQueryData(taxonQueryOptions(numericId));
    await context.queryClient.ensureQueryData(
      taxonCharacterValuesQueryOptions(numericId)
    );

    return { id: numericId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useLoaderData();
  const serverUpdate = useServerFn(updateTaxon);
  // TODO: probably shouldn't be a query, or at least should never update, or if it does it shouldn't overwrite form values.
  const { data: originalTaxon } = useSuspenseQuery(taxonQueryOptions(id));
  const navigate = useNavigate();

  // TODO: actual dirtiness
  const [dirty, setDirty] = useState(true);

  const updateFromValues = async (status: "draft" | "active") => {
    return serverUpdate({
      data: {
        id,
        parent_id: originalTaxon.parentId,
        rank: originalTaxon.rank,
        status,
      },
    });
  };

  const handleSaveDraft: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    await updateFromValues("draft")
      .then(() => {
        // TODO: Feedback
        setDirty(false);
      })
      .catch((e) => console.error(e));
  };

  // TODO: why is this redirecting to taxa, which then redirects to edit?
  const handlePublish: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // TODO: use actual values
    await updateFromValues("active")
      .then(() => navigate({ to: "../" }))
      .catch((e) => console.error(e));
  };

  // TODO: sort out use of form elements (form.control?) and form wrapping maybe unused elements
  return (
    <Box>
      <small>Editing details for:</small>
      <Heading mb="2">{originalTaxon.acceptedName}</Heading>
      <Form.Form onSubmit={handlePublish}>
        <Box mb="2">
          <Heading size="4">Characters</Heading>
        </Box>

        <Flex>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: ".." })}
            disabled={!dirty}
          >
            Cancel
          </Button>
          <Button variant="soft" onClick={handleSaveDraft} disabled={!dirty}>
            Save Draft
          </Button>
          <Form.Submit asChild>
            <Button variant="solid">Publish</Button>
          </Form.Submit>
        </Flex>
      </Form.Form>
    </Box>
  );
}
