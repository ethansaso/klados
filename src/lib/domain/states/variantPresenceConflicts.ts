import type {
  FeaturePresence,
  FeatureSemantics,
} from "../../../../db/schema/schema";

/**
 * Variants are alternatives: among siblings, either one is present and the
 * rest absent, or they're any mix of variable and absent.
 * Returns one message per parent that breaks this.
 */
export function variantPresenceConflicts(
  features: {
    label: string;
    parentId: number | null;
    semantics: FeatureSemantics;
    presence: FeaturePresence;
  }[],
): string[] {
  const markedByParent = new Map<
    number | null,
    { labels: string[]; hasPresent: boolean }
  >();
  for (const feature of features) {
    if (feature.semantics !== "variant" || feature.presence === "absent") {
      continue;
    }
    const marked = markedByParent.get(feature.parentId) ?? {
      labels: [],
      hasPresent: false,
    };
    marked.labels.push(feature.label);
    marked.hasPresent ||= feature.presence === "present";
    markedByParent.set(feature.parentId, marked);
  }

  return [...markedByParent.values()]
    .filter(({ labels, hasPresent }) => hasPresent && labels.length > 1)
    .map(
      ({ labels }) =>
        `${new Intl.ListFormat("en").format(labels)} are alternatives. Mark one present and the others absent, or mark them variable or absent.`,
    );
}
