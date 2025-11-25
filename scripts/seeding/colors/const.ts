export const BASE_HUE_NAMES = [
  ["pink", "red", "red"],
  ["red-orange", "red-orange", "red-brown"],
  ["orange", "orange", "brown"],
  ["yellow-orange", "yellow-orange", "yellow-brown"],
  ["yellow", "yellow", "olive-brown"],
  ["yellow-green", "yellow-green", "olive-green"],
  ["green", "green", "green"],
  ["blue-green", "blue-green", "teal"],
  ["blue", "blue", "blue"],
  ["purple", "purple", "purple"],
  ["red-purple", "red-purple", "red-purple"],
] as const satisfies readonly [string, string, string][];
export const HUE_MAP = [
  0, 20, 30, 45, 60, 80, 120, 180, 240, 270, 300,
] as const;

export const NEUTRAL_COLOR_NAMES = [
  "white",
  "light-gray",
  "gray",
  "dark-gray",
  "black",
] as const satisfies readonly string[];
export const NEUTRAL_MAP = [
  "#FFFFFF",
  "#CCCCCC",
  "#888888",
  "#444444",
  "#000000",
] as const;

export const MODIFIERS = [
  "light",
  "",
  "dark",
  "pale",
  "grayish",
  "dark-grayish",
] as const;
export const MODIFIERS_SL: { s: number; l: number }[] = [
  { s: 1, l: 0.8 },
  { s: 1, l: 0.5 },
  { s: 1, l: 0.25 },
  { s: 0.6, l: 0.85 },
  { s: 0.5, l: 0.5 },
  { s: 0.5, l: 0.25 },
];
