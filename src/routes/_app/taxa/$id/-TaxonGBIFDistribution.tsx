import { Box, Link, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { themeQueryOptions } from "../../../../lib/queries/theme";

type Props = {
  /** One per column, in column order. May point at Klados' cache or at GBIF. */
  densityUrls: string[];
  gbifId: number;
  taxonName: string;
};

/** Density renders distribution, basemap renders background. */
const BASEMAP_PATH = "/basemaps";
const GBIF_SPECIES_URL = "https://www.gbif.org/species";
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

export function TaxonGBIFDistribution({
  densityUrls,
  gbifId,
  taxonName,
}: Props) {
  const { data: theme } = useQuery(themeQueryOptions());
  const basemapTheme = theme === "dark" ? "dark" : "light";

  const basemap = (x: number) => `${BASEMAP_PATH}/${basemapTheme}-${x}.png`;

  return (
    <>
      <a
        href={`${GBIF_SPECIES_URL}/${gbifId}`}
        target="_blank"
        rel="noreferrer"
        style={{ display: "block" }}
      >
        <Box
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
            {densityUrls.map((url, x) => (
              <img
                key={url}
                src={url}
                alt=""
                loading="lazy"
                style={{ ...LAYER_STYLE, left: `${x * 50}%` }}
              />
            ))}
          </Box>
        </Box>
      </a>
      <MapAttribution />
    </>
  );
}

/** OSM data is ODbL */
function MapAttribution() {
  return (
    <Text as="p" size="1" color="gray" mt="1">
      Occurrence data from{" "}
      <Link href="https://www.gbif.org" target="_blank" rel="noreferrer">
        GBIF
      </Link>
      . Basemap ©{" "}
      <Link
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        OpenStreetMap
      </Link>{" "}
      contributors, ©{" "}
      <Link href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
        OpenMapTiles
      </Link>
      .
    </Text>
  );
}

function latToY(lat: number) {
  return (90 - lat) / 180;
}
