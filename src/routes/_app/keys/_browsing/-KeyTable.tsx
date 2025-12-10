import { Table } from "@radix-ui/themes";
import { KeyDTO } from "../../../../lib/domain/keys/types";
import { KeyRow } from "./-KeyRow";

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

export const KeyTable = ({ items }: { items: KeyDTO[] }) => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Key Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Creator Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Votes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((r) => (
          <KeyRow key={r.id} rowData={r} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};
