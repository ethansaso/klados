import { Box, Flex, Link, Text } from "@radix-ui/themes";

interface ExternalResultSummaryProps {
  scientific_name: string;
  rank: string;
  link: string;
  common_name?: string;
  imgSrc?: string;
}

export const ExternalResultSummary = ({
  scientific_name,
  common_name,
  rank,
  imgSrc,
  link,
}: ExternalResultSummaryProps) => {
  return (
    <Flex direction="column" align="center" gap="3">
      {imgSrc ? (
        <Box
          width="160px"
          height="160px"
          overflow="hidden"
          style={{
            borderRadius: 8,
            border: "1px solid var(--gray-6)",
            background: "var(--gray-3)",
          }}
        >
          <img
            src={imgSrc}
            alt={scientific_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
          />
        </Box>
      ) : null}

      <Box style={{ textAlign: "center" }}>
        <Text as="div">
          <Link
            href={link}
            weight="bold"
            size="4"
            color="gray"
            highContrast
            underline="hover"
          >
            {scientific_name}
          </Link>
        </Text>
        {common_name ? (
          <Text as="div" color="gray">
            {common_name}
          </Text>
        ) : null}
        <Text as="div" color="gray" size="2">
          Rank: {rank}
        </Text>
      </Box>
    </Flex>
  );
};
