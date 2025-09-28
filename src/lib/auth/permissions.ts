import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  key: [],
  taxon: [],
  user: [],
  session: [],
} as const;

export const ac = createAccessControl(statement);

// Baseline roles
export const user = ac.newRole({
  taxon: [], // can propose new taxa
});

export const curator = ac.newRole({
  taxon: [], // extra powers for curation
});

export const admin = ac.newRole({
  taxon: [],
  user: [],
  session: [],
});
