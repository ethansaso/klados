import z from "zod";

export const orderDirEnum = z.enum(["asc", "desc"]);
export type OrderDir = z.infer<typeof orderDirEnum>;
