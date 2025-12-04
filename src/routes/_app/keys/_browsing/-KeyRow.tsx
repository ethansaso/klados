import {
  Flex,
  Link as RadixLink,
  Table,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { Link as NavLink } from "@tanstack/react-router";
import { PiSealCheckFill, PiSealQuestionFill } from "react-icons/pi";
import { UserBadge } from "../../../../components/UserBadge";
import { UserHoverCard } from "../../../../components/UserHoverCard";
import { UserDTO } from "../../../../lib/domain/users/types";

export type KeyStatus = "approved" | "pending";

export type KeyRowProps = {
  id: string;
  name: string;
  creatorName: string;
  creatorUsername: string;
  creatorDescription?: string;
  creatorRole: UserDTO["role"];
  dateCreated: string;
  lastModified: string;
  votes: number;
  status?: KeyStatus;
};

const statusMeta: Record<
  KeyStatus,
  {
    icon: React.ComponentType;
    color: React.ComponentProps<typeof Text>["color"];
    tooltip: string;
  }
> = {
  approved: {
    icon: PiSealCheckFill,
    color: "grass",
    tooltip: "Curator approved",
  },
  pending: {
    icon: PiSealQuestionFill,
    color: "amber",
    tooltip: "Awaiting curator approval",
  },
};

export const KeyRow = (row: KeyRowProps) => {
  const status = row.status ? statusMeta[row.status] : undefined;
  const Icon = status?.icon;

  return (
    <Table.Row key={row.id}>
      <Table.RowHeaderCell>
        <Flex align="center" gap="1">
          <RadixLink asChild>
            <NavLink to="/keys/$keyId" params={{ keyId: row.id }}>
              {row.name}
            </NavLink>
          </RadixLink>
          {status && Icon && (
            <Tooltip content={status.tooltip}>
              <Text color={status.color} asChild>
                <Icon />
              </Text>
            </Tooltip>
          )}
        </Flex>
      </Table.RowHeaderCell>
      <Table.Cell>
        <UserHoverCard username={row.creatorUsername} name={row.creatorName} />
        <UserBadge role={row.creatorRole} ml="2" />
      </Table.Cell>
      <Table.Cell>{row.dateCreated}</Table.Cell>
      <Table.Cell>{row.lastModified}</Table.Cell>
      <Table.Cell>{row.votes}</Table.Cell>
    </Table.Row>
  );
};
