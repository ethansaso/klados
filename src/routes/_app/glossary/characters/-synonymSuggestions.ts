import type { MediaDTO } from "../../../../lib/domain/media/types";
import type { TraitValueDTO } from "../../../../lib/domain/traits/types";

/** A ready-made image to offer in the menu. */
export type MediaSuggestion = { media: MediaDTO; caption: string };

/** Titled group of suggestions. */
export type MediaSuggestions = {
  title: string;
  items: MediaSuggestion[];
};

export type DescriptionSuggestion = { text: string; labels: string[] };

/** Each distinct non-blank description, with every label that has it. */
export function distinctDescriptions(
  members: TraitValueDTO[],
): DescriptionSuggestion[] {
  const labelsByText = new Map<string, string[]>();
  for (const { description, label } of members) {
    const text = description.trim();
    if (text)
      labelsByText.set(text, [...(labelsByText.get(text) ?? []), label]);
  }

  return [...labelsByText].map(([text, labels]) => ({ text, labels }));
}

/** Each distinct image, captioned with every label that uses it. */
export function distinctMedia(members: TraitValueDTO[]): MediaSuggestion[] {
  const byMediaId = new Map<number, MediaSuggestion>();
  for (const { media, label } of members) {
    if (!media) continue;
    const seen = byMediaId.get(media.id);
    byMediaId.set(media.id, {
      media,
      caption: seen ? `${seen.caption}, ${label}` : label,
    });
  }

  return [...byMediaId.values()];
}
