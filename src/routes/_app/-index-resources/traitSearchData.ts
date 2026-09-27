import type { MediaLicense } from "../../../../db/utils/mediaLicense";

export type DemoPhoto = {
  url: string;
  owner: string;
  license: MediaLicense;
  source?: string;
};

export type TraitDemoSpecies = {
  sciName: string;
  commonName: string;
  photo: DemoPhoto;
  /** Keys of the toggleable filters this species satisfies. */
  traits: string[];
  /** Cap diameter range in cm, matched by containment like the real search. */
  capDiameter: [number, number];
};

export type TraitToggle = { key: string; label: string; hex?: string };

export type TraitGroup = {
  label: string;
  /** A word in the label to explain with a glossary hover card. */
  term?: { word: string; description: string };
  toggles: TraitToggle[];
};

/**
 * Mirrors the real filter kinds: categorical states scoped to a feature
 * (colors), bare feature presence (structures), and a numeric range.
 */
export const TRAIT_GROUPS: TraitGroup[] = [
  {
    label: "Cap color",
    toggles: [
      { key: "cap:white", label: "white", hex: "#ffffff" },
      { key: "cap:yellow", label: "yellow", hex: "#f5c83a" },
      { key: "cap:orange", label: "orange", hex: "#f39a3d" },
      { key: "cap:blue", label: "blue", hex: "#4a5aa8" },
      { key: "cap:brown", label: "brown", hex: "#8a5a3a" },
    ],
  },
  {
    label: "Hymenium color",
    term: {
      word: "Hymenium",
      description:
        "The spore-bearing surface of a mushroom, such as its gills or pores.",
    },
    toggles: [
      { key: "hymenium:white", label: "white", hex: "#ffffff" },
      { key: "hymenium:pink", label: "pink", hex: "#e8a090" },
      { key: "hymenium:yellow", label: "yellow", hex: "#e8d44a" },
      { key: "hymenium:blue", label: "blue", hex: "#4a5aa8" },
      { key: "hymenium:brown", label: "brown", hex: "#9a5a30" },
    ],
  },
  {
    label: "Structures",
    toggles: [
      { key: "gills", label: "Gills" },
      { key: "pores", label: "Pores" },
      { key: "ring", label: "Ring" },
    ],
  },
];

export const CAP_DIAMETER_BOUNDS = { min: 1, max: 20 } as const;

export const TRAIT_DEMO_SPECIES: TraitDemoSpecies[] = [
  {
    sciName: "Amanita aprica",
    commonName: "Sunshine Amanita",
    photo: {
      url: "/demo-img/aaprica.webp",
      owner: "Alan Rockefeller",
      license: "cc-by-sa",
      source: "https://www.inaturalist.org/photos/3868206",
    },
    traits: ["cap:yellow", "cap:orange", "gills", "hymenium:white", "ring"],
    capDiameter: [5, 15],
  },
  {
    sciName: "Pluteus petasatus",
    commonName: "Scaly Shield",
    photo: {
      url: "/demo-img/ppetasatus.webp",
      owner: "Jenny Glenn",
      license: "cc-by-nc",
      source: "https://www.inaturalist.org/photos/16473290",
    },
    traits: [
      "cap:white",
      "cap:brown",
      "gills",
      "hymenium:white",
      "hymenium:pink",
    ],
    capDiameter: [5, 20],
  },
  {
    sciName: "Boletus edulis",
    commonName: "King Bolete",
    photo: {
      url: "/demo-img/bedulis.webp",
      owner: "Alan Rockefeller",
      license: "cc-by",
      source: "https://www.inaturalist.org/photos/148026039",
    },
    traits: ["cap:brown", "pores", "hymenium:white", "hymenium:yellow"],
    capDiameter: [7, 25],
  },
  {
    sciName: "Rickenella fibula",
    commonName: "Orange Moss Navel",
    photo: {
      url: "/demo-img/rfibula.webp",
      owner: "Alexis Tinker-Tsavalas",
      license: "cc-by",
      source: "https://www.inaturalist.org/photos/240071558",
    },
    traits: ["cap:orange", "cap:yellow", "gills", "hymenium:white"],
    capDiameter: [0.3, 1.1],
  },
  {
    sciName: "Lactarius indigo",
    commonName: "Indigo Milk Cap",
    photo: {
      url: "/demo-img/lindigo.webp",
      owner: "Dan Molter",
      license: "cc-by-sa",
      source: "https://www.inaturalist.org/photos/28314678",
    },
    traits: ["cap:blue", "gills", "hymenium:blue"],
    capDiameter: [5, 15],
  },
  {
    sciName: "Chalciporus piperatus",
    commonName: "Peppery Bolete",
    photo: {
      url: "/demo-img/cpiperatus.webp",
      owner: "Jörg Hempel",
      license: "cc-by-sa",
      source: "https://www.inaturalist.org/photos/171178",
    },
    traits: ["cap:brown", "pores", "hymenium:brown"],
    capDiameter: [2, 7],
  },
];
