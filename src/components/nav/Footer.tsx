import { Flex, Link, Text } from "@radix-ui/themes";
import { ContentContainer } from "../ContentContainer";

export const Footer = () => {
  return (
    <footer className="footer">
      {/* <ContentContainer align="start" p="0"></ContentContainer> */}
      <ContentContainer align="start" p="0" className="footer__attr">
        <Flex
          direction={{ initial: "column", xs: "row" }}
          align="center"
          justify="between"
          width="100%"
          px={{ initial: "2", sm: "0" }}
        >
          <Text color="gray">© 2025 Klados. All rights reserved.</Text>
          <Text color="gray">
            Built with <Text highContrast>❤️</Text> by{" "}
            <Link
              href="https://ethansaso.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              color="amber"
            >
              Ethan Saso
            </Link>
          </Text>
        </Flex>
      </ContentContainer>
    </footer>
  );
};
