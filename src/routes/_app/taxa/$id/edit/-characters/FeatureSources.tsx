import {
  Badge,
  Button,
  Checkbox,
  Flex,
  IconButton,
  Popover,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { PiPlus, PiX } from "react-icons/pi";
import { formatPublicationUsage } from "../../../../../../lib/utils/formatting/formatPublication";
import type { NumberedFeatureCitation } from "../-sources/citableSources";

type Props = {
  sourceIds: number[];
  citableSources: NumberedFeatureCitation[];
  onChange: (sourceIds: number[]) => void;
};

/** A feature's citations, picked from the taxon's own sources. */
export function FeatureSources({ sourceIds, citableSources, onChange }: Props) {
  const cited = citableSources.filter((c) =>
    sourceIds.includes(c.source.sourceId),
  );

  const setCited = (sourceId: number, isCited: boolean) =>
    onChange(
      isCited
        ? [...sourceIds, sourceId]
        : sourceIds.filter((id) => id !== sourceId),
    );

  return (
    // Min height fits a chip, so the footer is the same height with or without citations
    <Flex align="center" wrap="wrap" gap="1" minHeight="24px">
      {cited.map((c) => (
        <Tooltip
          key={c.source.sourceId}
          content={formatPublicationUsage(c.source)}
        >
          <Badge variant="surface" color="gray">
            <Text color="amber">[{c.number}]</Text>
            <IconButton
              type="button"
              size="1"
              variant="ghost"
              color="tomato"
              aria-label={`Remove source ${c.number}`}
              onClick={() => setCited(c.source.sourceId, false)}
              style={{ margin: 0, padding: 2, width: "auto", height: "auto" }}
            >
              <PiX size={10} />
            </IconButton>
          </Badge>
        </Tooltip>
      ))}
      <Popover.Root>
        <Popover.Trigger>
          <Button
            type="button"
            size="1"
            variant="ghost"
            className="cite-button"
          >
            <PiPlus size={10} />
            Cite
          </Button>
        </Popover.Trigger>
        <Popover.Content size="1" maxWidth="360px" align="start">
          {citableSources.length > 0 ? (
            <Flex direction="column" gap="2">
              {citableSources.map((c) => (
                <Text as="label" size="1" key={c.source.sourceId}>
                  <Flex gap="2" align="start">
                    <Checkbox
                      size="1"
                      mt="1"
                      checked={sourceIds.includes(c.source.sourceId)}
                      onCheckedChange={(checked) =>
                        setCited(c.source.sourceId, checked === true)
                      }
                    />
                    <span>
                      <Text color="amber">[{c.number}]</Text>{" "}
                      {formatPublicationUsage(c.source)}
                    </span>
                  </Flex>
                </Text>
              ))}
            </Flex>
          ) : (
            <Text as="p" size="1" color="gray">
              This taxon has no sources yet. Add them under Sources in the
              sidebar, then cite them here.
            </Text>
          )}
        </Popover.Content>
      </Popover.Root>
    </Flex>
  );
}
