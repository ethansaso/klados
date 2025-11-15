import {
  Box,
  Button,
  Flex,
  Link,
  Spinner,
  Strong,
  Text,
} from "@radix-ui/themes";
import { PiArrowLeft, PiArrowRight } from "react-icons/pi";

interface ExternalResultSummaryProps {
  taxon?: {
    scientific_name: string;
    rank: string;
    link: string;
    common_name?: string;
    imgSrc?: string;
  };
  searchTitle: string;
  loading: boolean;
  error: string | null;

  /** 0-based. */
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

export const ExternalResultSummary = ({
  taxon,
  searchTitle,
  loading,
  error,
  index,
  total,
  onPrev,
  onNext,
}: ExternalResultSummaryProps) => {
  return (
    <Flex direction="column" align="center" gap="3">
      {error ? (
        <Text color="red">{error}</Text>
      ) : loading ? (
        <>
          <Spinner />
          <Text align="center">
            Searching for <Strong>{searchTitle}</Strong>...
          </Text>
        </>
      ) : taxon ? (
        <>
          <Flex align="center" gap="2">
            <Button
              variant="soft"
              disabled={total === undefined || total <= 1}
              onClick={onPrev}
              style={{ padding: "32px 6px" }}
            >
              <PiArrowLeft />
            </Button>
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
                src={taxon.imgSrc ?? "/logos/LogoDotted.svg"}
                alt={taxon.scientific_name}
                key={taxon.imgSrc}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null; // prevent infinite loop
                  e.currentTarget.src = "/logos/LogoDotted.svg";
                }}
              />
            </Box>
            <Button
              variant="soft"
              disabled={total === undefined || total <= 1}
              onClick={onNext}
              style={{ padding: "32px 6px" }}
            >
              <PiArrowRight />
            </Button>
          </Flex>
          <Box style={{ textAlign: "center" }}>
            <Text as="div">
              <Link
                href={taxon.link}
                target="_blank"
                weight="bold"
                size="4"
                color="gray"
                highContrast
                underline="hover"
              >
                {taxon.scientific_name}
              </Link>
            </Text>
            {taxon.common_name ? (
              <Text as="div" color="gray">
                {taxon.common_name}
              </Text>
            ) : null}
            <Text as="div" color="gray" size="2">
              Rank: {taxon.rank}
            </Text>
          </Box>
        </>
      ) : null}
    </Flex>
  );
};
