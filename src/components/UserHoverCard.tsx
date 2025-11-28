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
import { getInitials } from "../lib/utils/getInitials";

type Size = "1" | "2" | "3";

interface UserHoverCardProps {
  username: string;
  name: string;
  imageUrl?: string;
  description?: string;
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
          <Box>
            <Heading size={headerSize(size)} as="h3">
              {name}
            </Heading>
            {/* CoPilot: please write the following line to choose size - 1, min 1*/}
            <Text as="div" size={bodySize(size)} color="gray">
              @{username}
            </Text>
            {description && (
              <Text as="div" size={bodySize(size)} mt="2">
                {description}
              </Text>
            )}
          </Box>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
};
