import "./TaxonGrid.css";

import { Grid, Text } from "@radix-ui/themes";
import classNames from "classnames";
import { type TaxonDTO } from "../../../../lib/domain/taxa/types";
import { TaxonTile } from "./TaxonTile";

type Props = {
  taxa: TaxonDTO[];
  /** Widens the leading tiles to fill the first row. */
  featured?: boolean;
};

export function TaxonGrid({ taxa, featured = false }: Props) {
  if (!taxa.length) return <Text>No taxa found.</Text>;
  return (
    <Grid
      columns={{ initial: "3", xs: "4", md: "6" }}
      gap={{ initial: "1", sm: "2" }}
      className={classNames("taxon-grid", {
        "taxon-grid--featured": featured,
      })}
    >
      {taxa.map((t) => (
        <div key={t.id} className="taxon-grid__cell">
          <TaxonTile taxon={t} />
        </div>
      ))}
    </Grid>
  );
}
