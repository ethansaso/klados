export type ExternalCandidate = {
  id: number;
  scientificName: string;
  rank: string;
  link: string;
  commonName?: string;
  imgSrc?: string;
  /** Higher classification names, descending. */
  lineage: string[];
};
