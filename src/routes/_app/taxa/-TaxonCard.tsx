import { Link } from "@tanstack/react-router";

export const TaxonCard = ({ taxon }) => {
  return (
    <li key={taxon.id}>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        {taxon.canonical} <small>({taxon.rank})</small>
      </Link>
    </li>
  );
};