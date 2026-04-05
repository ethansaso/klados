import { Heading, Text } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

const Header = ({ children }: PropsWithChildren) => {
  return <Heading mb="3">{children}</Heading>;
};

const Text_ = ({ children }: PropsWithChildren) => {
  return (
    <Text as="p" mb="2">
      {children}
    </Text>
  );
};

const List = ({ children }: PropsWithChildren) => {
  return <ul>{children}</ul>;
};

const ListItem = ({ children }: PropsWithChildren) => {
  return <li>{children}</li>;
};

export const GlossaryProse = {
  Header,
  Text: Text_,
  List,
  ListItem,
};
