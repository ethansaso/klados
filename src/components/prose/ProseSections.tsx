import { Box, Heading, Text } from "@radix-ui/themes";

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Box asChild mb="6">
      <section>
        {title && (
          <Heading size="4" as="h2" mb="3">
            {title}
          </Heading>
        )}
        {children}
      </section>
    </Box>
  );
}

function Subsection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <>
      <Heading size="3" as="h3" mb="3">
        {title}
      </Heading>
      {children}
    </>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <Text as="p" mb="3">
      {children}
    </Text>
  );
}

export const ProseSections = {
  Section,
  Subsection,
  Content,
};
