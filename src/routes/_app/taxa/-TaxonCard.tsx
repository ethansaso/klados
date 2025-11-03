import { Card } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { TaxonDTO } from "../../../lib/serverFns/taxa/types";

export const TaxonCard = ({ taxon }: { taxon: TaxonDTO }) => {
  return (
    <Card className="taxon-card" asChild>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        {taxon.acceptedName} <small>({taxon.rank})</small>
      </Link>
    </Card>
  );
};
