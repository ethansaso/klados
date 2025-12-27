import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  IconButton,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PiGraphFill, PiMagnifyingGlass, PiPlusCircle } from "react-icons/pi";
import { GlossarySidebarList } from "../-chrome/GlossarySidebarList";
import { ContentContainer } from "../../../../components/ContentContainer";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { useSectionSearch } from "../../../../lib/hooks/useSectionSearch";
import { characterGroupsQueryOptions } from "../../../../lib/queries/characterGroups";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddCharacterGroupModal } from "./-AddCharacterGroupModal";

export const Route = createFileRoute("/_app/glossary/groups")({
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      characterGroupsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = useSectionSearch(Route);
  const { data: paginatedResult } = useSuspenseQuery(
    characterGroupsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  // const matchRoute = useMatchRoute();
  // const match = matchRoute({ to: "/glossary/groups/$groupId", fuzzy: true });
  // const selectedId = match ? (match.groupId as string | undefined) : undefined;

  return (
    <Flex height="0" flexGrow="1">
      <Flex direction="column" width="275px" height="100%" p="4">
        <DebouncedTextField
          initialValue={search.q}
          onDebouncedChange={(value) => setQ(value)}
          mb="3"
          radius="large"
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
          <CuratorOnly>
            <TextField.Slot>
              <IconButton
                size="1"
                onClick={() => NiceModal.show(AddCharacterGroupModal)}
              >
                <PiPlusCircle />
              </IconButton>
            </TextField.Slot>
          </CuratorOnly>
        </DebouncedTextField>
        <GlossarySidebarList.Root>
          {paginatedResult.items.map((item) => (
            <GlossarySidebarList.Item
              key={item.id}
              keyStr={item.key}
              label={item.label}
              to="/glossary/groups/$setId"
              params={{ setId: String(item.id) }}
            >
              <Flex align="center" gap="1" asChild>
                <Text as="div" size="1">
                  {item.characterCount}
                  <PiGraphFill />
                </Text>
              </Flex>
            </GlossarySidebarList.Item>
          ))}
        </GlossarySidebarList.Root>
        <Box mt="auto">
          <PaginationFooter
            page={paginatedResult.page}
            pageSize={paginatedResult.pageSize}
            total={paginatedResult.total}
            onPrev={() => prev()}
            onNext={() => next(paginatedResult.total)}
          />
        </Box>
      </Flex>
      <Separator orientation="vertical" size="4" />
      <ContentContainer align="stretch">
        <Outlet />
      </ContentContainer>
    </Flex>
  );
}
