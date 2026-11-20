import { Anchor, Card, Table, Text } from "@mantine/core";
import { isTransitional, type ResourceStatus, type ServerResource } from "@mini-cloud/shared";
import { fullDate, timeAgo } from "../../../lib/format.ts";
import { StatusBadge } from "../../../ui/molecules/StatusBadge.tsx";

const NO_WRAP = { whiteSpace: "nowrap" } as const;

/** One line under the badge saying what is happening, in words. */
const STATUS_HINTS: Partial<Record<ResourceStatus, string>> = {
  pending: "Waiting for a worker",
  provisioning: "Terraform is creating it",
};

function UrlCell({ server }: Readonly<{ server: ServerResource }>) {
  const url = server.outputs.url;
  if (server.status === "running" && url) {
    return (
      <Anchor href={url} target="_blank" rel="noreferrer" ff="monospace" fz="sm">
        {url.replace(/^https?:\/\//, "")}
      </Anchor>
    );
  }
  return <Text c="dimmed">{isTransitional(server.status) ? "Ready soon" : "—"}</Text>;
}

function StatusCell({ server }: Readonly<{ server: ServerResource }>) {
  const hint = server.status === "failed" ? server.error : STATUS_HINTS[server.status];
  return (
    <>
      <StatusBadge status={server.status} />
      {hint ? (
        <Text size="xs" mt={4} c={server.status === "failed" ? "red.9" : "dimmed"}>
          {hint}
        </Text>
      ) : null}
    </>
  );
}

export function ServersTable({ servers }: Readonly<{ servers: ServerResource[] }>) {
  return (
    <Card withBorder padding={0} radius="lg">
      <Table.ScrollContainer minWidth={720}>
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Image</Table.Th>
              <Table.Th>URL</Table.Th>
              <Table.Th>Created</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {servers.map((server) => (
              <Table.Tr key={server.id}>
                <Table.Td fw={600} style={NO_WRAP}>
                  {server.name}
                </Table.Td>
                <Table.Td>
                  <StatusCell server={server} />
                </Table.Td>
                <Table.Td ff="monospace" fz="sm" style={NO_WRAP}>
                  {server.spec.image}
                </Table.Td>
                <Table.Td style={NO_WRAP}>
                  <UrlCell server={server} />
                </Table.Td>
                <Table.Td c="dimmed" title={fullDate(server.createdAt)} style={NO_WRAP}>
                  {timeAgo(server.createdAt)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
