import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import NavSidebar from "../../../../components/nav/NavSidebar";
import { editUserFn } from "../../../../lib/api/users/editUser";
import {
  UserPatch,
  userPatchSchema,
} from "../../../../lib/domain/users/validation";
import {
  meQueryOptions,
  userQueryOptions,
} from "../../../../lib/queries/users";
import { toast } from "../../../../lib/utils/toast";

export const Route = createFileRoute("/_app/users/$username/edit")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      userQueryOptions(params.username)
    );
  },
  component: RouteComponent,
});

// TODO: try to keep user id out of the form state if possible
function RouteComponent() {
  const serverEditUser = useServerFn(editUserFn);
  const { data: user } = useSuspenseQuery(
    userQueryOptions(Route.useParams().username)
  );
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userPatchSchema),
    defaultValues: {
      userId: user.id,
      name: user.name ?? "",
      description: user.description ?? "",
    },
  });

  const onSubmit: SubmitHandler<UserPatch> = async ({
    userId,
    name,
    description,
  }) => {
    try {
      await serverEditUser({
        data: {
          userId,
          name,
          description,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: meQueryOptions().queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: userQueryOptions(user.username).queryKey,
      });
      toast({
        variant: "success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "error",
        description: "Failed to update profile.",
      });
    }
  };

  if (me?.username !== user?.username) {
    if (!(me?.role === "admin")) {
      return <Text color="tomato">TODO: unauthorized.</Text>;
    } else {
      return (
        <Text color="tomato">
          Admin editing other users not yet implemented.
        </Text>
      );
    }
  }
  return (
    <Flex gap="3">
      <NavSidebar.Root>
        <NavSidebar.Item to={``} active>
          Profile
        </NavSidebar.Item>
        <NavSidebar.Item to={``} active={false}>
          Other thing
        </NavSidebar.Item>
      </NavSidebar.Root>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="name">Display Name</Label.Root>
            <ConditionalAlert id="name-error" message={errors.name?.message} />
          </Flex>
          <TextField.Root
            id="name"
            type="text"
            {...register("name")}
            {...a11yProps("name-error", !!errors.name)}
          />
        </Box>
        <Box>
          <Flex justify="between" align="baseline" mb="1" mt="4">
            <Label.Root htmlFor="description">Description</Label.Root>
            <ConditionalAlert
              id="description-error"
              message={errors.description?.message}
            />
          </Flex>
          <TextArea
            id="description"
            {...register("description")}
            {...a11yProps("description-error", !!errors.description)}
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </Box>
        <Flex>
          <Button
            type="submit"
            mt="6"
            color="grass"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Save
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
