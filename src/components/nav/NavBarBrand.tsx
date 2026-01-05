import { Flex, Link as RtLink, Text } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function NavBarBrand() {
  return (
    <RtLink asChild underline="none" highContrast>
      <RouterLink to="/" preload="intent">
        <Flex align="center" gap="2" px="2" py="1" mr="4">
          <Logo size={24} />
          <Text weight="bold" size="6">
            Klados
          </Text>
        </Flex>
      </RouterLink>
    </RtLink>
  );
}
