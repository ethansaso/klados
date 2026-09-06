import NiceModal from "@ebay/nice-modal-react";
import { Box, Button, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiCaretLeft, PiCaretRight, PiSubtractSquare } from "react-icons/pi";
import { LookalikeDialog } from "../../../../../components/dialogs/LookalikeDialog";
import { LookalikePercentBadge } from "../../../../../components/LookalikeBadge";
import { TaxonCard } from "../../../../../components/TaxonCard";
import type { TaxonLookalikeDTO } from "../../../../../lib/domain/lookalikes/types";

interface LookalikesListProps {
  taxonId: number;
  taxonName: string;
  lookalikes: TaxonLookalikeDTO[];
}

/** Fraction of the visible width a button press travels. */
const PAGE_FRACTION = 0.8;

// TODO: consider confidence differential heuristic for when % matched and Jaccard diverge greatly
export const LookalikesList = ({
  taxonId,
  taxonName,
  lookalikes,
}: LookalikesListProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState({ prev: false, next: false });

  const syncScrollable = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;
    setScrollable({ prev: el.scrollLeft > 1, next: el.scrollLeft < max - 1 });
  }, []);

  // ResizeObserver fires on observe, so this covers the first measurement too.
  // Re-runs on length so a different taxon's list is measured again.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(syncScrollable);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncScrollable, lookalikes.length]);

  const page = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * el.clientWidth * PAGE_FRACTION,
      behavior: "smooth",
    });
  };

  return (
    <Box>
      <Flex
        align="end"
        justify="between"
        style={{ borderBottom: "1px solid var(--gray-a7)" }}
      >
        <Heading size={{ initial: "3", sm: "4" }} mb="1" weight="medium">
          Similar Taxa
        </Heading>
        {lookalikes.length > 0 && (
          <Flex gap="2" style={{ margin: "0 0 var(--space-1) 0" }}>
            <IconButton
              size="1"
              variant="ghost"
              aria-label="Show previous similar taxa"
              disabled={!scrollable.prev}
              onClick={() => page(-1)}
            >
              <PiCaretLeft />
            </IconButton>
            <IconButton
              size="1"
              variant="ghost"
              aria-label="Show more similar taxa"
              disabled={!scrollable.next}
              onClick={() => page(1)}
            >
              <PiCaretRight />
            </IconButton>
          </Flex>
        )}
      </Flex>

      {lookalikes.length ? (
        <Text as="p" color="gray" size="1" mb="3">
          These taxa share similar characteristics with {taxonName}. Click on
          any taxon to compare side-by-side.
        </Text>
      ) : (
        <Text size={{ initial: "2", sm: "3" }}>
          We couldn't determine any lookalikes for this taxon.
        </Text>
      )}

      {lookalikes.length > 0 && (
        <Flex
          ref={scrollerRef}
          className="lookalikes-list"
          onScroll={syncScrollable}
        >
          {lookalikes.map((l) => (
            <Flex key={l.id} direction="column" className="lookalikes-entry">
              <TaxonCard
                id={l.id}
                rank={l.rank}
                acceptedName={l.acceptedName}
                preferredCommonName={l.preferredCommonName}
                thumbnail={l.media[0]}
                serveAsLink
                size="1"
                inset
              >
                <Box position="absolute" top="2" right="2">
                  <LookalikePercentBadge percentage={l.jaccard} />
                </Box>
              </TaxonCard>
              <Button
                size="1"
                variant="surface"
                onClick={() =>
                  NiceModal.show(LookalikeDialog, {
                    taxonId,
                    lookalikeId: l.id,
                  })
                }
              >
                <PiSubtractSquare />
                Compare
              </Button>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
};
