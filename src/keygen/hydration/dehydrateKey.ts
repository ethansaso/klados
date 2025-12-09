import {
  KeyBranch,
  KeyBranchRationale,
  KeyCharRationale,
  KeyDiffNode,
  KeyNode,
  KeyPAGroupRationale,
  KeyTaxonNode,
} from "../key-building/types";
import {
  FrontendBranchRationale,
  FrontendKeyBranch,
  FrontendKeyNode,
  FrontendTaxonNode,
} from "./types";

function dehydrateBranchRationale(
  rationale: FrontendBranchRationale
): KeyBranchRationale {
  if (!rationale) return null;

  switch (rationale.kind) {
    case "character-definition": {
      const characters: KeyCharRationale["characters"] = {};

      for (const [charIdStr, info] of Object.entries(rationale.characters)) {
        const charId = Number(charIdStr);
        characters[charId] = {
          traits: info.traits.map((t) => t.id),
          inverted: info.inverted,
        };
      }

      return { kind: "character-definition", characters };
    }

    case "group-present-absent": {
      const groups: KeyPAGroupRationale["groups"] = {};

      for (const [groupIdStr, info] of Object.entries(rationale.groups)) {
        const groupId = Number(groupIdStr);
        groups[groupId] = {
          groupId,
          status: info.status,
        };
      }

      return { kind: "group-present-absent", groups };
    }

    default:
      return null;
  }
}

function dehydrateBranch(branch: FrontendKeyBranch): KeyBranch {
  return {
    id: branch.id,
    rationale: dehydrateBranchRationale(branch.rationale),
    child: dehydrateNode(branch.child),
  };
}

function dehydrateNode(node: FrontendKeyNode): KeyNode {
  switch (node.kind) {
    case "taxon": {
      const taxonNode: KeyTaxonNode = {
        kind: "taxon",
        id: node.id,
        branches: node.branches.map(dehydrateBranch),
      };
      return taxonNode;
    }
    case "diff": {
      const diffNode: KeyDiffNode = {
        kind: "diff",
        id: node.id,
        branches: node.branches.map(dehydrateBranch),
      };
      return diffNode;
    }
    default:
      throw new Error(`Unknown node kind`);
  }
}

export function dehydrateFrontendKey(root: FrontendTaxonNode): KeyTaxonNode {
  const raw = dehydrateNode(root);
  if (raw.kind !== "taxon") {
    throw new Error("Root of key must be a taxon node");
  }
  return raw;
}
