import { KeyStatus } from "../../../db/schema/schema";
import { PaginatedResult } from "../../validation/pagination";
import { UserDTO } from "../users/types";

export type KeyDTO = {
  id: number;
  author: UserDTO;
  rootTaxon: {
    id: number;
    acceptedName: string;
  };
  name: string;
  description?: string;
  status: KeyStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface KeyPaginatedResult extends PaginatedResult {
  items: KeyDTO[];
}
