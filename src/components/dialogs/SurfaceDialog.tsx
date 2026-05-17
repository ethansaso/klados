import { Box, Dialog, Flex } from "@radix-ui/themes";
import classNames from "classnames";
import type React from "react";
import type { ComponentProps } from "react";
import "./SurfaceDialog.css";

const Content: React.FC<ComponentProps<typeof Dialog.Content>> = ({
  children,
  className,
  ...props
}) => (
  <Flex direction="column" asChild>
    <Dialog.Content
      className={classNames("surface-dialog__content", className)}
      {...props}
    >
      {children}
    </Dialog.Content>
  </Flex>
);

const Title: React.FC<ComponentProps<typeof Dialog.Title>> = ({
  children,
  ...props
}) => (
  <Dialog.Title className="surface-dialog__title" mb="0" {...props}>
    {children}
  </Dialog.Title>
);

const Body: React.FC<ComponentProps<typeof Box>> = ({ children, ...props }) => (
  <Box
    className="surface-dialog__body"
    overflow="hidden"
    flexGrow="1"
    {...props}
  >
    {children}
  </Box>
);

const Row: React.FC<ComponentProps<typeof Box>> = ({ children, ...props }) => (
  <Box className="surface-dialog__row" {...props}>
    {children}
  </Box>
);

const Col: React.FC<ComponentProps<typeof Flex>> = ({ children, ...props }) => (
  <Flex className="surface-dialog__col" direction="column" {...props}>
    {children}
  </Flex>
);

const Footer: React.FC<ComponentProps<typeof Box>> = ({
  children,
  ...props
}) => (
  <Box className="surface-dialog__footer" {...props}>
    {children}
  </Box>
);

const SurfaceDialog = {
  Content,
  Title,
  Body,
  Row,
  Col,
  Footer,
};

export default SurfaceDialog;
