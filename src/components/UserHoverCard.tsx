import {
  Avatar,
  Box,
  Flex,
  Heading,
  HoverCard,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { Link as TSLink } from "@tanstack/react-router";
import { UserRole } from "../db/schema/auth";
import { getInitials } from "../lib/utils/getInitials";
import { RoleBadge } from "./UserBadge";

type Size = "1" | "2" | "3";

interface UserHoverCardProps {
  username: string;
  name: string;
  imageUrl?: string;
  description?: string | null;
  role?: UserRole;
  size?: "1" | "2" | "3";
}

const headerSize = (size: Size) => size;
const bodySize = (size: Size) => {
  const num = parseInt(size);
  return num > 1 ? ((num - 1).toString() as Size) : "1";
};

export const UserHoverCard = ({
  username,
  name,
  imageUrl,
  description,
  role,
  size = "2",
}: UserHoverCardProps) => {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <RadixLink asChild>
          <TSLink to="/users/$username" params={{ username }}>
            @{username}
          </TSLink>
        </RadixLink>
      </HoverCard.Trigger>
      <HoverCard.Content maxWidth="300px" size={size}>
        <Flex gap="4">
          <Avatar
            src={imageUrl}
            fallback={getInitials(name)}
            radius="full"
            size={size}
            variant="soft"
          />
          <Flex gap="2">
            <Box>
              <Heading size={headerSize(size)} as="h3">
                {name}
              </Heading>
              <Text as="div" size={bodySize(size)} color="gray">
                @{username}
              </Text>
            </Box>
            {role && <RoleBadge role={role} />}
          </Flex>
        </Flex>
        {description && (
          <Text as="div" size={bodySize(size)} mt="2">
            {description}
          </Text>
        )}
      </HoverCard.Content>
    </HoverCard.Root>
  );
};
