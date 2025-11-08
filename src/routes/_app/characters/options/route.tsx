import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, TextField } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiMagnifyingGlass, PiPlusCircle, PiTrash } from "react-icons/pi";
import z from "zod";
import { optionSetsQueryOptions } from "../../../../lib/queries/options";
import { deleteOptionSet } from "../../../../lib/serverFns/characters/options/fns";
import { OptionSetDTO } from "../../../../lib/serverFns/characters/options/types";
import { toast } from "../../../../lib/utils/toast";
import { AddOptionSetModal } from "./-AddOptionSetModal";
import { ConfirmOptionSetDeleteModal } from "./-ConfirmOptionSetDeleteModal";

const SearchSchema = z.object({
  q: z.string().trim().catch("").default(""),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
});

export const Route = createFileRoute("/_app/characters/options")({
  validateSearch: (s) => SearchSchema.parse(s),
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      optionSetsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const navigate = Route.useNavigate();
  const serverDelete = useServerFn(deleteOptionSet);
  const { data: paginatedResult } = useSuspenseQuery(
    optionSetsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  const handleOptionSetDeleteClick = (optionSet: OptionSetDTO) => {
    NiceModal.show(ConfirmOptionSetDeleteModal, {
      label: optionSet.label,
      onConfirm: async () => {
        try {
          await serverDelete({ data: { id: optionSet.id } });
          qc.invalidateQueries({ queryKey: ["optionSets"] });
          toast({
            variant: "success",
            description: `Option set "${optionSet.label}" deleted successfully.`,
          });
        } catch (error) {
          toast({
            variant: "error",
            description: `Failed to delete option set "${optionSet.label}".`,
          });
        }
      },
    });
  };

  return (
    <Flex>
      <Box>
        <TextField.Root>
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </TextField.Root>
        <IconButton onClick={() => NiceModal.show(AddOptionSetModal)}>
          <PiPlusCircle />
        </IconButton>
        {paginatedResult.items.map((item) => (
          <Link
            to="/characters/options/$setId"
            params={{ setId: String(item.id) }}
            search={search}
            key={item.id}
          >
            <Flex gap="3">
              {item.label}
              <IconButton
                size="1"
                color="tomato"
                onClick={() => handleOptionSetDeleteClick(item)}
              >
                <PiTrash />
              </IconButton>
            </Flex>
          </Link>
        ))}
        <Flex>
          <button>foo</button>
          {paginatedResult.page}
          <button>bar</button>
        </Flex>
      </Box>
      <Outlet />
    </Flex>
  );
}
