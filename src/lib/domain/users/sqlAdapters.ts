import { user as userTbl } from "../../../db/schema/schema";

export const userDtoSelection = {
  id: userTbl.id,
  username: userTbl.username,
  displayUsername: userTbl.displayUsername,
  name: userTbl.name,
  image: userTbl.image,
  createdAt: userTbl.createdAt,
  banned: userTbl.banned,
  role: userTbl.role,
  description: userTbl.description,
};
