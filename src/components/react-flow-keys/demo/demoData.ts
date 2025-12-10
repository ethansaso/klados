import { DemoEdge, DemoNode } from "./demoTypes";

export const demoNodes: DemoNode[] = [
  {
    id: "1",
    type: "demoTaxonNode",
    position: { x: 100, y: 465 },
    data: {
      sciName: "Amanitaceae",
      commonName: "Amanita and allies",
      primaryMedia: {
        url: "/demo-img/amanitaceae.jpg",
        source: "https://www.inaturalist.org/photos/7018635",
        license: "cc-by",
        owner: "Davide Puddu",
      },
    },
  },
  {
    id: "2",
    type: "demoTaxonNode",
    position: { x: 520, y: 310 },
    data: {
      sciName: "Amanita",
      commonName: "Amanita mushrooms",
      primaryMedia: {
        url: "/demo-img/amanita.jpg",
        source: "https://www.inaturalist.org/photos/4133102",
        license: "cc-by-nc",
        owner: "Christian Schwarz",
      },
    },
  },
  {
    id: "3",
    type: "demoTaxonNode",
    position: { x: 520, y: 620 },
    data: {
      sciName: "Limacella",
      commonName: "Slimecaps",
      primaryMedia: {
        url: "/demo-img/limacella.jpg",
        source: "https://www.inaturalist.org/photos/13704939",
        license: "cc-by-nc",
        owner: "tombigelow",
      },
    },
  },
  {
    id: "4",
    type: "demoTaxonNode",
    position: { x: 1040, y: 310 },
    data: {
      sciName: "Amanita muscaria",
      commonName: "Fly Agaric",
      primaryMedia: {
        url: "/demo-img/amuscaria.jpg",
        source: "https://www.inaturalist.org/photos/111494893",
        license: "cc-by-nc",
        owner: "Federico Calledda",
      },
    },
  },
  {
    id: "5",
    type: "demoTaxonNode",
    position: { x: 1040, y: 620 },
    data: {
      sciName: "Amanita phalloides",
      commonName: "Death Cap",
      primaryMedia: {
        url: "/demo-img/aphalloides.jpg",
        source: "https://www.inaturalist.org/photos/111266235",
        license: "cc-by-nc",
        owner: "Federico Calledda",
      },
    },
  },
];

export const demoEdges: DemoEdge[] = [
  {
    id: "e1-2",
    type: "demoEdge",
    source: "1",
    target: "2",
    data: {
      charStates: {
        "Cap texture": [{ label: "Smooth" }, { label: "dry" }],
      },
    },
  },
  {
    id: "e1-3",
    type: "demoEdge",
    source: "1",
    target: "3",
    data: {
      charStates: {
        "Cap texture": [{ label: "Slimy" }],
      },
    },
  },
  {
    id: "e2-4",
    type: "demoEdge",
    source: "2",
    target: "4",
    data: {
      charStates: {
        "Cap color": [
          { label: "Bright orange-red", hexCode: "#ff4500" },
          { label: "orange-yellow", hexCode: "#ffb347" },
        ],
        "Veil remnants": [{ label: "Warty" }],
      },
    },
  },
  {
    id: "e2-5",
    type: "demoEdge",
    source: "2",
    target: "5",
    data: {
      charStates: {
        "Cap color": [
          { label: "White", hexCode: "#ffffff" },
          { label: "beige", hexCode: "#f0f0c2" },
          { label: "pale yellow-green", hexCode: "#e0f0c2" },
          { label: "grayish olive-green", hexCode: "#4a6020" },
        ],
        "Veil remnants": [{ label: "Patchy" }],
      },
    },
  },
];
