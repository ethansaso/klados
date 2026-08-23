import { Table } from "@radix-ui/themes";
import type { GuideDTO } from "../../../../lib/domain/guides/types";
import { GuideRow } from "./-GuideRow";

// const keyRows: KeyRowProps[] = [
//   {
//     id: 1,
//     name: "Curator Key",
//     creatorUsername: "ethansaso",
//     creatorName: "Ethan Saso",
//     creatorRole: "admin",
//     dateCreated: "2024-01-15",
//     lastModified: "2024-06-10",
//     votes: 42,
//     status: "approved",
//   },
//   {
//     id: 2,
//     name: "Questionable Key",
//     creatorUsername: "phildunphey",
//     creatorName: "Phil Dunphey",
//     creatorRole: "curator",
//     dateCreated: "2024-01-15",
//     lastModified: "2024-06-10",
//     votes: 7,
//     status: "pending",
//   },
//   {
//     id: 3,
//     name: "Unreputable Key",
//     creatorUsername: "badactor27",
//     creatorName: "Bad Actor",
//     creatorRole: "user",
//     dateCreated: "2024-01-15",
//     lastModified: "2024-06-10",
//     votes: -33,
//     status: "unapproved",
//   },
// ];

export const GuideTable = ({ items }: { items: GuideDTO[] }) => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Guide Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Creator</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Votes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((r) => (
          <GuideRow key={r.id} rowData={r} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};
