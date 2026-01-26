type MatchLike = {
  pathname: string;
};

/** Simple function which declares a canonical using the 'match' argument of a head function. */
export function matchCanonicalHead(match: MatchLike) {
  return {
    links: [{ rel: "canonical", href: match.pathname }],
  };
}
