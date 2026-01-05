import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Theme,
} from "@radix-ui/themes";
import { LinkComponentProps, Link as RouterLink } from "@tanstack/react-router";
import { Dialog } from "radix-ui";
import { PiX } from "react-icons/pi";
import type { getMeFn } from "../../lib/api/users/getMe";
import { roleHasCuratorRights } from "../../lib/auth/utils";

type Props = {
  user: Awaited<ReturnType<typeof getMeFn>> | undefined;
  onNavigate: () => void;
};

type NavSheetLinkButtonProps = {
  children: React.ReactNode;
  onNavigate: () => void;
  color?: React.ComponentProps<typeof Button>["color"];
} & LinkComponentProps<typeof RouterLink>;

function NavSheetLinkButton({
  children,
  preload = "intent",
  onNavigate,
  ...linkProps
}: NavSheetLinkButtonProps) {
  return (
    <Flex asChild justify="start">
      <Button variant="ghost" size="3" asChild onClick={onNavigate}>
        <RouterLink preload={preload} {...linkProps}>
          {children}
        </RouterLink>
      </Button>
    </Flex>
  );
}

function NavSheetSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading size="3" weight="medium" mt="4">
      {children}
    </Heading>
  );
}

/** Navigation sheet designed for mobile devices */
export function NavSheet({ user, onNavigate }: Props) {
  const isCurator = roleHasCuratorRights(user?.role);

  return (
    <Dialog.Portal>
      <Theme>
        <Dialog.Content style={{ maxWidth: 420 }} className="nav-sheet">
          <Box className="nav-sheet__content">
            <Flex
              justify="between"
              align="center"
              className="nav-sheet__header"
              py="3"
              px="5"
            >
              <Dialog.Title asChild>
                <Heading size="5">Navigation</Heading>
              </Dialog.Title>
              <Dialog.Close asChild>
                <IconButton color="gray" variant="ghost">
                  <PiX />
                </IconButton>
              </Dialog.Close>
            </Flex>
            <Flex
              direction="column"
              gap="3"
              py="3"
              px="5"
              className="nav-sheet__links"
            >
              <NavSheetSectionHeading>Main</NavSheetSectionHeading>
              <NavSheetLinkButton to="/" onNavigate={onNavigate}>
                Home
              </NavSheetLinkButton>

              {!isCurator && (
                <NavSheetLinkButton to="/taxa" onNavigate={onNavigate}>
                  Taxa
                </NavSheetLinkButton>
              )}

              <NavSheetLinkButton to="/keys" onNavigate={onNavigate}>
                Keys
              </NavSheetLinkButton>

              <NavSheetLinkButton to="/glossary" onNavigate={onNavigate}>
                Glossary
              </NavSheetLinkButton>

              {isCurator && (
                <>
                  <NavSheetSectionHeading>Taxa</NavSheetSectionHeading>

                  <NavSheetLinkButton to="/taxa" onNavigate={onNavigate}>
                    Browse taxa
                  </NavSheetLinkButton>
                  <NavSheetLinkButton to="/taxa/new" onNavigate={onNavigate}>
                    Create taxon
                  </NavSheetLinkButton>
                  <NavSheetLinkButton to="/taxa/drafts" onNavigate={onNavigate}>
                    Drafts
                  </NavSheetLinkButton>
                </>
              )}

              <NavSheetSectionHeading>More</NavSheetSectionHeading>
              <NavSheetLinkButton to="/users" onNavigate={onNavigate}>
                Users
              </NavSheetLinkButton>
              <NavSheetLinkButton to="/about" onNavigate={onNavigate}>
                About
              </NavSheetLinkButton>
              <NavSheetLinkButton to="/donate" onNavigate={onNavigate}>
                Donate
              </NavSheetLinkButton>
            </Flex>
          </Box>
        </Dialog.Content>
      </Theme>
    </Dialog.Portal>
  );
}
