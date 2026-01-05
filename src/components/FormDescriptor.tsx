import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PropsWithChildren } from "react";

type Props = {
  title: string;
  description: string;
  /** Note: at small screen sizes, orientation defaults to vertical setup */
  orientation?: "vertical" | "horizontal";
};

export const FormDescriptor = ({
  title,
  description,
  orientation = "horizontal",
  children,
}: PropsWithChildren<Props>) => {
  return (
    <Flex
      gap={{
        initial: "4",
        ...(orientation === "horizontal" ? { md: "6" } : {}),
      }}
      direction={
        orientation === "horizontal"
          ? { initial: "column", md: "row" }
          : "column"
      }
    >
      <Flex>
        <Box
          width={orientation === "horizontal" ? { md: "350px" } : undefined}
          flexShrink="0"
        >
          <Heading size="3" weight="medium" mb="2">
            {title}
          </Heading>
          <Text color="gray" size="2">
            {description}
          </Text>
        </Box>
      </Flex>
      <Box flexGrow="1">{children}</Box>
    </Flex>
  );
};
