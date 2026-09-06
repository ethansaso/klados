import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { themeQueryOptions } from "../../../../lib/queries/theme";

type Props = {
  gbifId: number;
  taxonName: string;
};

/** Density renders distribution, basemap renders background */
const BASEMAP_URL = "https://tile.gbif.org/4326/omt/0";
const DENSITY_URL = "https://api.gbif.org/v2/map/occurrence/density/0";
/** Larger means smaller hexes (more per tile) */
const HEX_PER_TILE = 60;
/** Each zoom-0 title covers 180° of longitude */
const COLUMNS = [0, 1];
/** Crops out pieces of the extreme polar regions (sorry Antarctica) */
const CROP_TOP = latToY(83);
const CROP_HEIGHT = latToY(-60) - CROP_TOP;
/** Shared styles of basemap/density layers */
const LAYER_STYLE = {
  position: "absolute",
  top: 0,
  width: "50%",
  display: "block",
} as const;

export function TaxonGBIFDistribution({ gbifId, taxonName }: Props) {
  const { data: theme } = useQuery(themeQueryOptions());
  const basemapStyle = `gbif-${theme === "dark" ? "dark" : "light"}`;

  const basemap = (x: number) =>
    `${BASEMAP_URL}/${x}/0@2x.png?style=${basemapStyle}`;
  const density = (x: number) =>
    `${DENSITY_URL}/${x}/0@2x.png?taxonKey=${gbifId}` +
    `&style=classic.poly&bin=hex&hexPerTile=${HEX_PER_TILE}&srs=EPSG:4326`;

  return (
    <Box
      key={gbifId}
      role="img"
      aria-label={`World map of recorded occurrences of ${taxonName}`}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: `${2 / CROP_HEIGHT}`,
        borderRadius: "var(--radius-2)",
      }}
    >
      {/* Slides upward via 'top' to effectively crop region */}
      <Box
        style={{
          position: "absolute",
          width: "100%",
          aspectRatio: "2",
          top: `${(-CROP_TOP / CROP_HEIGHT) * 100}%`,
        }}
      >
        {COLUMNS.map((x) => (
          <img
            key={`base-${x}`}
            src={basemap(x)}
            alt=""
            style={{ ...LAYER_STYLE, left: `${x * 50}%` }}
          />
        ))}
        {COLUMNS.map((x) => (
          <img
            key={`density-${x}`}
            src={density(x)}
            alt=""
            loading="lazy"
            style={{ ...LAYER_STYLE, left: `${x * 50}%` }}
          />
        ))}
      </Box>
    </Box>
  );
}

function latToY(lat: number) {
  return (90 - lat) / 180;
}
