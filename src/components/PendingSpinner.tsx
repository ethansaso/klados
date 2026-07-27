import { Flex, Spinner } from "@radix-ui/themes";

export const PendingSpinner = () => (
  <Flex flexGrow="1" align="center" justify="center" p="6">
    <Spinner size="3" />
  </Flex>
);
