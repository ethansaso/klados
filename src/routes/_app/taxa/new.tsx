import {
  Box,
  Button,
  DropdownMenu,
  Flex,
  Heading,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { FormEventHandler, useMemo, useState } from "react";
import { Combobox, ComboboxOption } from "../../../components/inputs/Combobox";
import { TAXON_RANKS_DESCENDING } from "../../../db/schema/schema";
import { roleHasCuratorRights } from "../../../lib/auth/utils";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { createTaxon } from "../../../lib/serverFns/taxa/fns";
import { getMe } from "../../../lib/serverFns/user";
import { capitalizeWord } from "../../../lib/utils/casing";

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
  const [parent, setParent] = useState<ComboboxOption | null>(null);
  const [acceptedName, setAcceptedName] = useState("");
  const [rank, setRank] = useState<(typeof TAXON_RANKS_DESCENDING)[number]>(
    TAXON_RANKS_DESCENDING[0]
  );
  const serverCreate = useServerFn(createTaxon);
  const navigate = useNavigate();
  const {
    data: parentPaginatedResults,
    error,
    isError,
  } = useQuery(
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
        parent_id: parent?.id ?? null,
      },
    })
      .then((res) => navigate({ to: `/taxa/${res.id}` }))
      .catch((e) => console.error(e));
  };

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      parentPaginatedResults?.items.map((taxon) => ({
        id: taxon.id,
        label: taxon.acceptedName,
      })) ?? [],
    [parentPaginatedResults]
  );

  return (
    <Box>
      <Heading>Add New Taxon</Heading>
      <Form.Form onSubmit={onSubmit}>
        <Flex>
          <Form.Field name="acceptedName">
            <Form.Label>Accepted name</Form.Label>
            <TextField.Root onChange={(e) => setAcceptedName(e.target.value)} />
          </Form.Field>
          <Box>
            <Combobox.Root
              label="Parent taxon"
              value={parent}
              onValueChange={setParent}
              options={comboboxOptions}
              onQueryChange={setParentQ}
            >
              <Combobox.Trigger placeholder="Select parent taxon" />
              <Combobox.Content>
                <Combobox.Input />
                <Combobox.List>
                  {comboboxOptions.map((option, index) => (
                    <Combobox.Item
                      key={option.id}
                      index={index}
                      option={option}
                    />
                  ))}
                </Combobox.List>
              </Combobox.Content>
            </Combobox.Root>
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
