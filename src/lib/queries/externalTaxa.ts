import { queryOptions, type UseQueryOptions } from "@tanstack/react-query";
import type { TaxonRank } from "../../../db/schema/schema";
import { searchGbifCandidates } from "../../routes/_app/taxa/-external/gbif";
import {
  fetchInatImport,
  type InatTaxonImport,
  searchInatCandidates,
} from "../../routes/_app/taxa/-external/inat";
import type { ExternalCandidate } from "../../routes/_app/taxa/-external/types";

type ExternalCandidatesQueryKey = readonly [
  source: string,
  name: string,
  rank: TaxonRank,
];

export type ExternalCandidatesQueryOptions = (
  name: string,
  rank: TaxonRank,
) => UseQueryOptions<
  ExternalCandidate[],
  Error,
  ExternalCandidate[],
  ExternalCandidatesQueryKey
>;

export const gbifCandidatesQueryOptions: ExternalCandidatesQueryOptions = (
  name,
  rank,
) =>
  queryOptions<
    ExternalCandidate[],
    Error,
    ExternalCandidate[],
    ExternalCandidatesQueryKey
  >({
    queryKey: ["gbifCandidates", name, rank],
    queryFn: ({ signal }) => searchGbifCandidates(name, rank, signal),
    staleTime: Infinity,
    retry: false,
  });

export const inatCandidatesQueryOptions: ExternalCandidatesQueryOptions = (
  name,
  rank,
) =>
  queryOptions<
    ExternalCandidate[],
    Error,
    ExternalCandidate[],
    ExternalCandidatesQueryKey
  >({
    queryKey: ["inatCandidates", name, rank],
    queryFn: ({ signal }) => searchInatCandidates(name, rank, signal),
    staleTime: Infinity,
    retry: false,
  });

export const inatTaxonImportQueryOptions = (inatId: number) =>
  queryOptions<InatTaxonImport>({
    queryKey: ["inatTaxonImport", inatId],
    queryFn: ({ signal }) => fetchInatImport(inatId, signal),
  });
