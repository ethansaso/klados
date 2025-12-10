import { Flex, Link, Text } from "@radix-ui/themes";
import { ContentContainer } from "./ContentContainer";

export const Footer = () => {
  return (
    <footer className="footer">
      {/* <ContentContainer align="start" p="0"></ContentContainer> */}
      <ContentContainer align="start" p="0" className="footer__attr">
        <Flex justify="between" width="100%">
          <Text color="gray">© 2025 Klados. All rights reserved.</Text>
          <Text color="gray">
            Built with <Text color="red">❤️</Text> by{" "}
            <Link
              href="https://github.com/ethansaso"
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
