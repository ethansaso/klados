import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";
import { auth } from "./auth";

export const statement = {
  key: [],
  taxon: [],
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({});
export const curator = ac.newRole({});
export const admin = ac.newRole({...adminAc.statements});