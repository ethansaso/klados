import { CSSProperties, useState } from "react";
import { DropdownMenu, Avatar, Box, Text, Flex } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

type UserMenuProps = {
  name?: string;
  email?: string;
  imageUrl?: string;
  initials?: string;
  className?: string;
  style?: CSSProperties;
};

export function UserMenu({
  name = "User",
  email,
  imageUrl,
  initials = "U",
  className,
  style,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);

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
              fallback={initials}
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
            <Link to="/users" preload="intent">
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link to="/users/edit" preload="intent">
              Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.Item
            color="red"
            onSelect={(e) => {
              e.preventDefault();
              // await authClient.signOut();
              // window.location.assign("/");
            }}
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  );
}
