import { Fragment } from "react";
import type { TaxonRank } from "../../db/schema/schema";
import {
  formatTaxonNameParts,
  type RankPrefixMode,
} from "../lib/utils/formatting/formatTaxonName";

interface TaxonNameProps {
  rank: TaxonRank;
  name: string;
  prefixMode?: RankPrefixMode;
}

/** Formatted accepted scientific name, italicized per convention. */
export const TaxonName = ({ rank, name, prefixMode }: TaxonNameProps) => {
  const parts = formatTaxonNameParts(rank, name, prefixMode);

  // Merge adjacent parts of the same style so e.g. a binomial is one <i>
  const runs: { text: string; italic: boolean }[] = [];
  for (const part of parts) {
    const last = runs.at(-1);
    if (last && last.italic === part.italic) {
      last.text += ` ${part.text}`;
    } else {
      runs.push({ ...part });
    }
  }

  return (
    <>
      {runs.map((run, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {run.italic ? <i>{run.text}</i> : run.text}
        </Fragment>
      ))}
    </>
  );
};
