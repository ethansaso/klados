import { GuideStatus } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { UserDTO } from "../users/types";

export type GuideDTO = {
  id: number;
  author: UserDTO;
  rootTaxon: {
    id: number;
    acceptedName: string;
  };
  name: string;
  description?: string;
  status: GuideStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type GuidePaginatedResult = PaginatedResult<GuideDTO>;
