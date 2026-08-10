import { HoverCard, Text } from "@radix-ui/themes";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Demo stand-in for GlossaryCard */
export const DemoGlossaryTerm: React.FC<Props> = ({
  title,
  description,
  children,
}) => {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <span className="has-information">{children}</span>
      </HoverCard.Trigger>
      <HoverCard.Content maxWidth="224px" size="1" align="center" side="top">
        <Text as="p" weight="bold" size="1">
          {title}
        </Text>
        <Text as="p" size="1" color="gray" mt="1">
          {description}
        </Text>
      </HoverCard.Content>
    </HoverCard.Root>
  );
};
