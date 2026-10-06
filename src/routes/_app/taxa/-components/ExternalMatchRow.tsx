import { Box, Flex, IconButton, Link, Spinner, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { PiCaretLeft, PiCaretRight, PiLink, PiProhibit } from "react-icons/pi";
import type { ExternalCandidate } from "../-external/types";
import type { ExternalMatch } from "../-hooks/useExternalMatch";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import { getErrorMessage } from "../../../../lib/utils/getErrorMessage";

type ExternalMatchRowProps = {
  label: string;
  icon: ReactNode;
  match: ExternalMatch;
};

const THUMB_SIZE = 36;

export function ExternalMatchRow({
  label,
  icon,
  match,
}: ExternalMatchRowProps) {
  const { candidates, index, selected } = match;
  const canStep = candidates.length > 1;

  return (
    <Flex align="center" gap="3" px="3" py="2" className="external-match-row">
      <Flex
        flexShrink="0"
        width="20px"
        justify="center"
        title={label}
        aria-label={label}
      >
        {icon}
      </Flex>

      <Flex flexGrow="1" minWidth="0" align="center" height={`${THUMB_SIZE}px`}>
        <Body match={match} label={label} />
      </Flex>

      <Flex flexShrink="0" align="center" gap="2">
        {selected && (
          <>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              aria-label={`Previous ${label} match`}
              disabled={!canStep}
              onClick={match.prev}
            >
              <PiCaretLeft />
            </IconButton>
            <Text
              size="1"
              color="gray"
              style={{ minWidth: "3ch" }}
              align="center"
            >
              {(index ?? 0) + 1}/{candidates.length}
            </Text>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              aria-label={`Next ${label} match`}
              disabled={!canStep}
              onClick={match.next}
            >
              <PiCaretRight />
            </IconButton>
          </>
        )}
        {match.isSkipped ? (
          <ResponsiveTooltip content={`Link ${label}`}>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              onClick={match.link}
            >
              <PiLink />
            </IconButton>
          </ResponsiveTooltip>
        ) : (
          <ResponsiveTooltip content={`Don't link ${label}`}>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              color="red"
              aria-label={`Don't link ${label}`}
              onClick={match.skip}
            >
              <PiProhibit />
            </IconButton>
          </ResponsiveTooltip>
        )}
      </Flex>
    </Flex>
  );
}

function Body({ match, label }: { match: ExternalMatch; label: string }) {
  if (match.isSkipped) {
    return <Hint>Not linked; nothing imported from {label}.</Hint>;
  }
  if (match.isIdle) {
    return <Hint>Matches appear once a name is entered.</Hint>;
  }
  if (match.error) {
    return (
      <Text as="p" size="1" color="red" truncate>
        {getErrorMessage(match.error)}
      </Text>
    );
  }
  if (match.selected) {
    return (
      <CandidateSummary candidate={match.selected} dimmed={match.isSearching} />
    );
  }
  if (match.isSearching) {
    return (
      <Flex align="center" gap="2" minWidth="0">
        <Spinner size="1" />
        <Hint>Searching {label}…</Hint>
      </Flex>
    );
  }
  return (
    <Hint>
      No {label} matches for {match.searchTitle}.
    </Hint>
  );
}

function CandidateSummary({
  candidate,
  dimmed,
}: {
  candidate: ExternalCandidate;
  dimmed: boolean;
}) {
  return (
    <Flex
      gap="2"
      align="center"
      minWidth="0"
      style={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <Box
        flexShrink="0"
        width={`${THUMB_SIZE}px`}
        height={`${THUMB_SIZE}px`}
        overflow="hidden"
        style={{
          borderRadius: "var(--radius-2)",
          background: "var(--gray-3)",
        }}
      >
        <img
          key={candidate.imgSrc}
          src={candidate.imgSrc ?? "/logos/LogoDotted.svg"}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />
      </Box>
      <Box minWidth="0">
        <Text as="div" size="2" truncate>
          <Link
            href={candidate.link}
            target="_blank"
            rel="noreferrer"
            weight="medium"
            color="gray"
            highContrast
            underline="hover"
          >
            {candidate.scientificName}
          </Link>
          {candidate.commonName && (
            <Text color="gray"> · {candidate.commonName}</Text>
          )}
        </Text>
        <Text
          as="div"
          size="1"
          color="gray"
          truncate
          title={candidate.lineage.join(" › ")}
        >
          {[candidate.rank, formatLineage(candidate.lineage)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </Box>
    </Flex>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <Text as="p" size="1" color="gray" truncate>
      {children}
    </Text>
  );
}

// The nearest ranks do most of the disambiguating
function formatLineage(lineage: string[]): string {
  if (lineage.length <= 3) return lineage.join(" › ");
  return [lineage[0], "…", ...lineage.slice(-2)].join(" › ");
}
