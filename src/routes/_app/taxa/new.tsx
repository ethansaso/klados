import {
  Box,
  Button,
  DropdownMenu,
  Flex,
  Heading,
  TextField,
} from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Form, Label } from "radix-ui";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { FormEventHandler, useState } from "react";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { capitalizeWord } from "../../../lib/utils/capitalizeWord";
import { useServerFn } from "@tanstack/react-start";
import { createTaxon } from "../../../lib/serverFns/taxa";
import { getMe } from "../../../lib/serverFns/user";
import { roleHasCuratorRights } from "../../../lib/auth/utils";

export const Route = createFileRoute("/_app/taxa/new")({
  beforeLoad: async ({ context, location }) => {
    const user = await getMe();
    if (!roleHasCuratorRights(user?.role)) {
      throw redirect({ to: "/login" });
    }
    return {
      user,
    };
  },
  component: RouteComponent,
});

// TODO: validation
function RouteComponent() {
  const [parentQ, setParentQ] = useState("");
  const [acceptedName, setAcceptedName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [rank, setRank] = useState(TAXON_RANKS_DESCENDING[0]);
  const serverCreate = useServerFn(createTaxon);
  const navigate = useNavigate();
  // TODO: why doesn't useQuery work here?
  const {
    data: parentPaginatedResults,
    error,
    isError,
  } = useSuspenseQuery(
    taxaQueryOptions(1, 10, {
      q: parentQ,
      status: "active",
    })
  );

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!acceptedName) {
      alert("Put in a name TODO");
      return;
    }

    await serverCreate({
      data: {
        accepted_name: acceptedName,
        rank: rank,
        parent_id: parentId,
      },
    })
      .then((res) => navigate({ to: `/taxa/${res.id}` }))
      .catch((e) => console.error(e));
  };

  return (
    <Box>
      <Heading>Add New Taxon</Heading>
      <Form.Form onSubmit={onSubmit}>
        <Flex>
          <Box>
            <Label.Root>
              <Label.Label>Taxon name</Label.Label>
            </Label.Root>
            <TextField.Root onChange={(e) => setAcceptedName(e.target.value)} />
          </Box>
          <Box>
            <Label.Root>
              <Label.Label>Parent</Label.Label>
            </Label.Root>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button>{parentId}</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {parentPaginatedResults.items.map((p) => (
                  <DropdownMenu.Item
                    key={p.id}
                    onSelect={() => setParentId(p.id)}
                  >
                    {p.acceptedName}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Box>

          <Box>
            <Label.Root>
              <Label.Label>Rank</Label.Label>
            </Label.Root>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button>{capitalizeWord(rank)}</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {TAXON_RANKS_DESCENDING.map((r) => (
                  <DropdownMenu.Item key={r} onSelect={() => setRank(r)}>
                    {capitalizeWord(r)}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Box>
        </Flex>
        <Form.Submit asChild>
          <Button>Create taxon</Button>
        </Form.Submit>
      </Form.Form>
    </Box>
  );
}
