import { SourceDTO } from "../../../../../../lib/domain/sources/types";

export function formatPublication(s: SourceDTO): string {
  const parts = [
    s.authors?.trim(),
    s.publicationYear ? `(${s.publicationYear})` : "",
    s.name?.trim(),
    s.publisher?.trim(),
  ].filter(Boolean);
  return parts.join(" ");
}
