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
          <Text color="gray" align={{ initial: "center", xs: "left" }}>
            Text and data{" "}
            <Link
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              color="amber"
            >
              CC BY 4.0
            </Link>{" "}
            · Media as marked · Code{" "}
            <Link
              href="https://github.com/ethansaso/klados/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              color="amber"
            >
              MIT
            </Link>
          </Text>
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
