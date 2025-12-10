import {
  Flex,
  Link as RadixLink,
  Table,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { Link as NavLink } from "@tanstack/react-router";
import { PiSealCheckFill, PiSealQuestionFill } from "react-icons/pi";
import { RoleBadge } from "../../../../components/UserBadge";
import { UserHoverCard } from "../../../../components/UserHoverCard";
import { KeyStatus } from "../../../../db/schema/schema";
import { KeyDTO } from "../../../../lib/domain/keys/types";

export type KeyRowProps = {
  rowData: KeyDTO;
};

const statusMeta: Record<
  KeyStatus,
  {
    icon: React.ComponentType;
    color: React.ComponentProps<typeof Text>["color"];
    tooltip: string;
  } | null
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
  unapproved: null,
};

export const KeyRow = ({ rowData }: KeyRowProps) => {
  const { status, id, name, author, updatedAt } = rowData;
  const resolvedMeta = statusMeta[status];

  return (
    <Table.Row key={rowData.id}>
      <Table.RowHeaderCell>
        <Flex align="center" gap="1">
          <RadixLink asChild>
            <NavLink to="/keys/$id" params={{ id }}>
              {name}
            </NavLink>
          </RadixLink>
          {resolvedMeta && (
            <Tooltip content={resolvedMeta.tooltip}>
              <Text color={resolvedMeta.color} asChild>
                <resolvedMeta.icon />
              </Text>
            </Tooltip>
          )}
        </Flex>
      </Table.RowHeaderCell>
      <Table.Cell>
        <UserHoverCard
          username={author.name}
          name={author.name}
          description={author.description}
          role={author.role}
        />
        <RoleBadge role={author.role} ml="2" />
      </Table.Cell>
      <Table.Cell>
        {updatedAt.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </Table.Cell>
      <Table.Cell>0</Table.Cell>
    </Table.Row>
  );
};
