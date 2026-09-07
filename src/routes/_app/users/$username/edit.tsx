import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useRef } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import z from "zod";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import NavSidebar from "../../../../components/nav/NavSidebar";
import {
  AVATAR_IMAGE_TYPES,
  MAX_AVATAR_BYTES,
  type UserPatch,
  userPatchSchema,
} from "../../../../lib/domain/users/validation";
import {
  meQueryOptions,
  userQueryOptions,
} from "../../../../lib/queries/users";
import { editUserFn } from "../../../../lib/server-fns/users/editUserFn";
import { getAvatarUrl } from "../../../../lib/storage/getAvatarUrl";
import { fileToBase64 } from "../../../../lib/utils/fileToBase64";
import { getInitials } from "../../../../lib/utils/formatting/getInitials";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { toast } from "../../../../lib/utils/toast";

export const Route = createFileRoute("/_app/users/$username/edit")({
  head: ({ match }) =>
    routeSeo({
      title: "Edit profile | Klados",
      canonicalUrl: match.pathname,
    }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      userQueryOptions(params.username),
    );
  },
  component: RouteComponent,
});

// TODO: try to keep user id out of the form state if possible
function RouteComponent() {
  const serverEditUser = useServerFn(editUserFn);
  const { data: user } = useSuspenseQuery(
    userQueryOptions(Route.useParams().username),
  );
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<UserPatch>({
    resolver: zodResolver(userPatchSchema),
    defaultValues: {
      userId: user.id,
      name: user.name ?? "",
      description: user.description ?? "",
    },
  });

  // Undefined leaves the stored avatar alone, null clears it, an object replaces it.
  const avatar = useWatch({ control, name: "avatar" });
  const avatarSrc = avatar
    ? `data:${avatar.contentType};base64,${avatar.base64}`
    : avatar === null
      ? undefined
      : getAvatarUrl(user.image);

  const handleAvatarPick = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so re-picking the same file still fires onChange
    if (!file) return;

    const contentType = z.enum(AVATAR_IMAGE_TYPES).safeParse(file.type);
    if (!contentType.success) {
      setError("avatar", { message: "Use a JPEG, PNG, or WebP image." });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("avatar", { message: "Image is too large (max 2MB)." });
      return;
    }

    clearErrors("avatar");
    setValue(
      "avatar",
      { base64: await fileToBase64(file), contentType: contentType.data },
      { shouldDirty: true },
    );
  };

  const onCancel = () => {
    navigate({ to: "/users/$username", params: { username: user.username } });
  };

  const onSubmit: SubmitHandler<UserPatch> = async ({
    userId,
    name,
    description,
    avatar: pendingAvatar,
  }) => {
    try {
      await serverEditUser({
        data: {
          userId,
          name,
          description,
          avatar: pendingAvatar,
        },
      });

      // Drop the local preview so the freshly stored avatar takes over.
      setValue("avatar", undefined);

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
    } catch {
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
    <Box asChild>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex
          justify="between"
          pb="5"
          style={{ borderBottom: "1px solid var(--gray-5)" }}
        >
          <Heading size="7">Edit profile</Heading>
          <Flex gap="2">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save
            </Button>
          </Flex>
        </Flex>
        <Flex>
          <NavSidebar.Root>
            <NavSidebar.Item to={``} active>
              Profile
            </NavSidebar.Item>
          </NavSidebar.Root>
          <Box width="100%" p="5">
            <Box mb="4">
              <Text as="div" size="2" mb="1">
                Avatar
              </Text>
              <Flex gap="4" align="center">
                <Avatar
                  src={avatarSrc}
                  fallback={getInitials(user.name)}
                  alt=""
                  radius="none"
                  size="8"
                  style={{ width: "128px", height: "128px" }}
                />
                <Flex direction="column" align="start" gap="2">
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload avatar
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    color="gray"
                    disabled={!avatarSrc}
                    onClick={() =>
                      setValue("avatar", null, { shouldDirty: true })
                    }
                  >
                    Remove avatar
                  </Button>
                  <ConditionalAlert
                    id="avatar-error"
                    message={errors.avatar?.message}
                  />
                </Flex>
              </Flex>
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_IMAGE_TYPES.join(",")}
                style={{ display: "none" }}
                onChange={handleAvatarPick}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="name">Display Name</Label.Root>
                <ConditionalAlert
                  id="name-error"
                  message={errors.name?.message}
                />
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
          </Box>
        </Flex>
      </form>
    </Box>
  );
}
