import { Link } from "@tanstack/react-router";
import { TaxonDTO } from "../../../lib/serverFns/taxa";

export const TaxonCard = ({ taxon }: { taxon: TaxonDTO }) => {
  return (
    <li key={taxon.id}>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        {taxon.id} <small>({taxon.rank})</small>
      </Link>
    </li>
  );
};
