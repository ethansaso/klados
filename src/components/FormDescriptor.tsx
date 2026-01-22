import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PropsWithChildren } from "react";

type Props = {
  title: string;
  description: string;
  /** Note: at small screen sizes, orientation defaults to vertical setup */
  orientation?: "vertical" | "horizontal";
  /** Actions which appear alongside the description */
  actions?: React.ReactNode;
};

export const FormDescriptor = ({
  title,
  description,
  orientation = "horizontal",
  actions,
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
      <Flex
        direction={
          orientation === "horizontal"
            ? "column"
            : {
                initial: "column",
                md: "row",
              }
        }
        align={
          orientation === "horizontal"
            ? "start"
            : {
                initial: "start",
                md: "end",
              }
        }
        gap={
          orientation === "horizontal"
            ? "2"
            : {
                initial: "2",
                md: "9",
              }
        }
      >
        <Box
          width={
            orientation === "horizontal"
              ? { initial: "100%", md: "350px" }
              : "100%"
          }
          flexShrink="1"
        >
          <Heading size="3" weight="medium" mb="2">
            {title}
          </Heading>
          <Text color="gray" size="2">
            {description}
          </Text>
        </Box>
        {actions && (
          <Flex gap="1" flexShrink="0">
            {actions}
          </Flex>
        )}
      </Flex>
      {children && <Box flexGrow="1">{children}</Box>}
    </Flex>
  );
};
