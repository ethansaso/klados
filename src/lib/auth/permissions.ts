import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  key: [],
  taxon: [],
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({});
export const curator = ac.newRole({});
export const admin = ac.newRole({ ...adminAc.statements });
