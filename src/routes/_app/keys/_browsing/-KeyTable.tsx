import { Table } from "@radix-ui/themes";
import { KeyRow, KeyRowProps } from "./-KeyRow";

const keyRows: KeyRowProps[] = [
  {
    id: "1",
    name: "Curator Key",
    creatorUsername: "ethansaso",
    creatorName: "Ethan Saso",
    creatorRole: "admin",
    dateCreated: "2024-01-15",
    lastModified: "2024-06-10",
    votes: 42,
    status: "approved",
  },
  {
    id: "2",
    name: "Questionable Key",
    creatorUsername: "phildunphey",
    creatorName: "Phil Dunphey",
    creatorRole: "curator",
    dateCreated: "2024-01-15",
    lastModified: "2024-06-10",
    votes: 7,
    status: "pending",
  },
  {
    id: "3",
    name: "Unreputable Key",
    creatorUsername: "badactor27",
    creatorName: "Bad Actor",
    creatorRole: "user",
    dateCreated: "2024-01-15",
    lastModified: "2024-06-10",
    votes: -33,
  },
];

export const KeyTable = () => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Key Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Creator Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Date Created</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Last Modified</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Votes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {keyRows.map((r) => (
          <KeyRow key={r.id} {...r} />
        ))}
      </Table.Body>
    </Table.Root>
  );
};
