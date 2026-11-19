import "./TaxonomyTree.css";

import { Box, Heading, Text } from "@radix-ui/themes";
import type { CSSProperties } from "react";
import { RouterRadixLink } from "../../../../../components/RouterRadixLink";
import { TaxonName } from "../../../../../components/TaxonName";
import type {
  TaxonDetailDTO,
  TaxonDTO,
} from "../../../../../lib/domain/taxa/types";
import { taxonParams } from "../../../../../lib/utils/formatting/taxonUrl";

type TreeRow = {
  taxon: TaxonDTO;
  depth: number;
  isCurrent: boolean;
};

/** Full ancestry down to the taxon, then its direct subtaxa. */
export const TaxonomyTree = ({ taxon }: { taxon: TaxonDetailDTO }) => {
  const rows = getTreeRows(taxon);

  return (
    <Box id="taxonomy" className="taxon-section">
      <Heading
        size="4"
        mb="1"
        weight="medium"
        className="taxon-section__header"
      >
        Taxonomy
      </Heading>
      <ul className="taxonomy-tree">
        {rows.map((row) => (
          <TaxonomyTreeRow key={row.taxon.id} {...row} />
        ))}
      </ul>
    </Box>
  );
};

function TaxonomyTreeRow({ taxon, depth, isCurrent }: TreeRow) {
  const name = <TaxonName rank={taxon.rank} name={taxon.acceptedName} />;
  const commonName = taxon.preferredCommonName && (
    <>
      {" "}
      <Text color="gray" size="1">
        ({taxon.preferredCommonName})
      </Text>
    </>
  );

  return (
    <li
      className="taxonomy-tree__row"
      style={{ "--taxonomy-depth": depth } as CSSProperties}
    >
      <Text size="2" truncate>
        {isCurrent ? (
          <Text aria-current="page">
            <Text weight="bold">{name}</Text>
            {commonName}
          </Text>
        ) : (
          <RouterRadixLink to="/taxa/$id" params={taxonParams(taxon)}>
            {name}
            {commonName}
          </RouterRadixLink>
        )}
      </Text>
    </li>
  );
}

function getTreeRows(taxon: TaxonDetailDTO): TreeRow[] {
  const depth = taxon.ancestors.length;
  return [
    ...taxon.ancestors.map((ancestor, i) => ({
      taxon: ancestor,
      depth: i,
      isCurrent: false,
    })),
    { taxon, depth, isCurrent: true },
    ...taxon.subtaxa.map((subtaxon) => ({
      taxon: subtaxon,
      depth: depth + 1,
      isCurrent: false,
    })),
  ];
}
