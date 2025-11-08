import { Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiTreeStructure } from "react-icons/pi";
import { TaxonDTO } from "../../../lib/serverFns/taxa/types";
import { capitalizeWord } from "../../../lib/utils/casing";

export const TaxonCard = ({ taxon }: { taxon: TaxonDTO }) => {
  const primaryMedia = taxon.media[0];
  return (
    <Card className="taxon-card" asChild>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        <img
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
          alt={taxon.acceptedName}
          loading="lazy"
          style={{ border: "1px solid var(--gray-5)" }}
          onError={(e) => {
            e.currentTarget.onerror = null; // prevent infinite loop
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />
        <Text as="div" size="1" weight="bold" color="gray">
          {capitalizeWord(taxon.rank)}
        </Text>
        <Text as="div" weight="bold" mb="1" truncate>
          {taxon.acceptedName}
        </Text>
        <Flex align="center" gap="1" className="summary" asChild>
          <Text as="div" size="1" color="gray">
            <PiTreeStructure />
            {taxon.activeChildCount} child
            {taxon.activeChildCount == 1 ? "" : "ren"}
          </Text>
        </Flex>
      </Link>
    </Card>
  );
};
