import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiPencil, PiTrash } from "react-icons/pi";
import { Fragment } from "react/jsx-runtime";
import { CuratorOnly } from "../../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../../components/dialogs/ConfirmDeleteModal";
import { deleteFeatureFn } from "../../../../../lib/api/features/deleteFeatureFn";
import { featureQueryOptions } from "../../../../../lib/queries/features";
import { toast } from "../../../../../lib/utils/toast";

export const Route = createFileRoute("/_app/glossary/features/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: feature } = useSuspenseQuery(featureQueryOptions(id));
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const serverDelete = useServerFn(deleteFeatureFn);

  const handleFeatureDeleteClick = () => {
    NiceModal.show(ConfirmDeleteModal, {
      label: feature.label,
      itemType: "feature",
      onConfirm: async () => {
        try {
          await serverDelete({ data: { id: feature.id } });
          qc.invalidateQueries({ queryKey: ["features"] });
          qc.invalidateQueries({
            queryKey: featureQueryOptions(feature.id).queryKey,
          });
          navigate({
            to: "/glossary/features",
            search,
          });
          toast({
            variant: "success",
            description: `Feature "${feature.label}" deleted successfully.`,
          });
        } catch {
          toast({
            variant: "error",
            description: `Failed to delete feature "${feature.label}".`,
          });
        }
      },
    });
  };

  return (
    <Box>
      <Flex justify="between">
        <Heading size="6">{feature.label}</Heading>
        <CuratorOnly>
          <Flex gap="2">
            <IconButton asChild size="1">
              <Link
                to="/glossary/features/$id/edit"
                params={{ id: feature.id }}
              >
                <PiPencil />
              </Link>
            </IconButton>
            <IconButton size="1" onClick={handleFeatureDeleteClick} color="tomato">
              <PiTrash />
            </IconButton>
          </Flex>
        </CuratorOnly>
      </Flex>
      <Box mb="3">
        {feature.description ? (
          <Text>{feature.description}</Text>
        ) : (
          <Text color="gray">No description available.</Text>
        )}
      </Box>
      <Box mb="3">
        <Heading size="4" mb="1">
          Hierarchy
        </Heading>
        <Text as="p">
          Parent:{" "}
          {feature.parentFeature ? (
            <RadixLink asChild>
              <Link
                to="/glossary/features/$id"
                params={{ id: feature.parentFeature.id }}
              >
                {feature.parentFeature.label}
              </Link>
            </RadixLink>
          ) : (
            <Text color="gray">None</Text>
          )}
        </Text>
        <Text as="span">Subfeatures ({feature.subFeatures.length}): </Text>
        {feature.subFeatures.length > 0 ? (
          feature.subFeatures.map((sub, idx) => (
            <Fragment key={sub.id}>
              <RadixLink asChild>
                <Link to="/glossary/features/$id" params={{ id: sub.id }}>
                  {sub.label}
                </Link>
              </RadixLink>
              <Text>{idx < feature.subFeatures.length - 1 && ", "}</Text>
            </Fragment>
          ))
        ) : (
          <Text color="gray">No subfeatures.</Text>
        )}
      </Box>
      <Box mb="3">
        <Heading size="4" mb="1">
          Linked Characters
        </Heading>
        {feature.characters.length > 0 ? (
          feature.characters.map((char) => (
            <Flex key={char.id} gap="2">
              <RadixLink asChild>
                <Link to="/glossary/characters/$id" params={{ id: char.id }}>
                  {char.label}
                </Link>
              </RadixLink>
              {char.description && (
                <>
                  <Text>—</Text>
                  <Text> {char.description}</Text>
                </>
              )}
            </Flex>
          ))
        ) : (
          <Text color="gray">No linked characters.</Text>
        )}
      </Box>
    </Box>
  );
}
