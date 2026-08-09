import { customType } from "drizzle-orm/pg-core";

/** Simple shim to expose PostgreSQL `numrange`, since Drizzle doesn't. */
export const numrange = customType<{ data: string; driverData: string }>({
  dataType() {
    return "numrange";
  },
});
