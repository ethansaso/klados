import { CSSProperties, useState } from "react";
import { DropdownMenu, Avatar, Box, Text, Flex } from "@radix-ui/themes";
import { Link, useNavigate } from "@tanstack/react-router";
import { getInitials } from "../../lib/utils/getInitials";
import { authClient } from "../../lib/auth/authClient";

type UserMenuProps = {
  name: string;
  username: string;
  email: string;
  imageUrl?: string;
  className?: string;
  style?: CSSProperties;
};

export function UserMenu({
  name,
  username,
  email,
  imageUrl,
  className,
  style,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Hover opens/closes instantly; click toggles
  return (
    <Flex
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={className}
      style={style}
    >
      <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenu.Trigger>
          <button
            type="button"
            aria-label="Account menu"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <Avatar
              src={imageUrl}
              fallback={getInitials(name)}
              radius="full"
              size="2"
              variant="soft"
            />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          align="end"
          sideOffset={0}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenu.Label>
            <Box>
              <Text weight="bold">{name}</Text>
              {email ? (
                <Text as="div" size="1" color="gray">
                  {email}
                </Text>
              ) : null}
            </Box>
          </DropdownMenu.Label>

          <DropdownMenu.Separator />

          <DropdownMenu.Item asChild>
            <Link to="/users/$username" params={{ username }} preload="intent">
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild disabled>
            <Link to="/users/edit" preload="intent" disabled>
              Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.Item
            color="red"
            onSelect={async () => {
              const { error } = await authClient.signOut();
              if (error) {
                console.error("Sign out failed:", error);
              } else {
                navigate({ to: "/" });
              }
            }}
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  );
}
