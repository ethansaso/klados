import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PropsWithChildren } from "react";

type Props = {
  title: string;
  description: string;
};

export const FormDescriptor = ({
  title,
  description,
  children,
}: PropsWithChildren<Props>) => {
  return (
    <Flex gap="6">
      <Box width={{ md: "350px" }} flexShrink="0">
        <Heading size="3" weight="medium" mb="2">
          {title}
        </Heading>
        <Text color="gray" size="2">
          {description}
        </Text>
      </Box>
      <Box flexGrow="1">{children}</Box>
    </Flex>
  );
};
