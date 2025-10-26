import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { getMe } from "../../../../lib/serverFns/user";
import { roleHasCuratorRights } from "../../../../lib/auth/utils";
import { taxonQueryOptions } from "../../../../lib/queries/taxa";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { FormEventHandler, MouseEventHandler, useState } from "react";
import { Form } from "radix-ui";
import { useServerFn } from "@tanstack/react-start";
import { updateTaxon } from "../../../../lib/serverFns/taxa";

export const Route = createFileRoute("/_app/taxa/$id/edit")({
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

  // TODO: sort out use of form elements (form.control?)
  return (
    <Box>
      <small>Editing details for:</small>
      <Heading>{originalTaxon.acceptedName}</Heading>
      <Form.Form onSubmit={handlePublish}>
        <Flex>
          <Button variant="ghost" onClick={() => navigate({ to: ".." })}>
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
