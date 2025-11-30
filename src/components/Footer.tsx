import { Box } from "@radix-ui/themes";
import { ContentContainer } from "./ContentContainer";

export const Footer = () => {
  return (
    <footer className="footer">
      <ContentContainer align="start" p="1">
        <Box as="span">© 2024 Klados. All rights reserved.</Box>
      </ContentContainer>
    </footer>
  );
};
