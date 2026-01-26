import {
  Flex,
  Link as RadixLink,
  Table,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { Link as NavLink } from "@tanstack/react-router";
import { PiSealCheckFill, PiSealQuestionFill } from "react-icons/pi";
import type { GuideStatus } from "../../../../../db/schema/schema";
import { RoleBadge } from "../../../../components/UserBadge";
import { UserHoverCard } from "../../../../components/UserHoverCard";
import type { GuideDTO } from "../../../../lib/domain/guides/types";

export type GuideRowProps = {
  rowData: GuideDTO;
};

const statusMeta: Record<
  GuideStatus,
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

export const GuideRow = ({ rowData }: GuideRowProps) => {
  const { status, id, name, author, updatedAt } = rowData;
  const resolvedMeta = statusMeta[status];

  return (
    <Table.Row key={rowData.id}>
      <Table.RowHeaderCell>
        <Flex align="center" gap="1">
          <RadixLink asChild>
            <NavLink to="/guides/$id" params={{ id }}>
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
        <Flex gap="2" align="baseline">
          <UserHoverCard
            username={author.name}
            name={author.name}
            description={author.description}
            role={author.role}
          />
          <RoleBadge role={author.role} />
        </Flex>
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
