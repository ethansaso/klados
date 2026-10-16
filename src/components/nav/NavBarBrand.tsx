import { Flex, Heading, Link as RtLink } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function NavBarBrand() {
  return (
    <RtLink asChild underline="none" highContrast>
      <RouterLink to="/" preload="intent">
        <Flex align="center" gap="2" px="2" py="1" mr="4">
          <Logo size={24} />
          {/* Heading font without heading semantics */}
          <Heading asChild size="6">
            <span>Klados</span>
          </Heading>
        </Flex>
      </RouterLink>
    </RtLink>
  );
}
