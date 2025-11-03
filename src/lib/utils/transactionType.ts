import { db } from "../../db/client";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
