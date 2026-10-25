import type { FeaturePresence } from "../../../../db/schema/schema";
import type { FeatureTreeNode } from "../features/types";
import type { FeatureStateDTO } from "../states/types";

/**
 * Inferred feature presence from marks and hierarchy.
 * * A present or variable feature makes its ancestors present, even over an absent mark.
 * * A present variant makes its unmarked variant siblings absent.
 * * An absent feature makes its unmarked descendants absent.
 */
export function resolvePresence(
  tree: FeatureTreeNode[],
  features: FeatureStateDTO[],
): Map<number, FeaturePresence> {
  const byId = new Map(tree.map((node) => [node.id, node]));
  const children = new Map<number | null, FeatureTreeNode[]>();
  for (const node of tree) {
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }

  const presence = new Map<number, FeaturePresence>();
  for (const feature of features)
    presence.set(feature.featureId, feature.presence);

  for (const feature of features) {
    if (feature.presence === "absent") continue;
    let ancestorId = byId.get(feature.featureId)?.parentId ?? null;
    while (ancestorId !== null) {
      if (presence.get(ancestorId) !== "variable") {
        presence.set(ancestorId, "present");
      }
      ancestorId = byId.get(ancestorId)?.parentId ?? null;
    }
  }

  for (const node of tree) {
    if (node.semantics !== "variant" || presence.get(node.id) !== "present") {
      continue;
    }
    for (const sibling of children.get(node.parentId) ?? []) {
      if (sibling.semantics === "variant" && !presence.has(sibling.id)) {
        presence.set(sibling.id, "absent");
      }
    }
  }

  function markDescendantsAbsent(id: number) {
    for (const child of children.get(id) ?? []) {
      if (presence.has(child.id)) continue;
      presence.set(child.id, "absent");
      markDescendantsAbsent(child.id);
    }
  }
  for (const [id, status] of [...presence]) {
    if (status === "absent") markDescendantsAbsent(id);
  }

  return presence;
}
