import { Button, Card, Skeleton, Stack, Text } from "@mantine/core";
import { PAGE_LIMIT_MAX } from "@mini-cloud/shared";
import { IconPlus, IconServer2 } from "@tabler/icons-react";
import { Link } from "react-router";
import { ApiError } from "../../../api/errors.ts";
import { ErrorAlert } from "../../../ui/molecules/ErrorAlert.tsx";
import { EmptyState } from "../../../ui/organisms/EmptyState.tsx";
import { PageHeader } from "../../../ui/organisms/PageHeader.tsx";
import { useServers } from "../api.ts";
import { ServersTable } from "../components/ServersTable.tsx";

const CREATE_PATH = "/servers/new";

function CreateButton() {
  return (
    <Button component={Link} to={CREATE_PATH} leftSection={<IconPlus size={16} aria-hidden />}>
      Create server
    </Button>
  );
}

function LoadingRows() {
  return (
    <Card withBorder radius="lg" aria-busy="true" aria-label="Loading servers">
      <Stack gap="sm">
        {[1, 2, 3].map((row) => (
          <Skeleton key={row} height={28} />
        ))}
      </Stack>
    </Card>
  );
}

function ServersContent() {
  const servers = useServers();

  if (servers.isPending) return <LoadingRows />;
  if (servers.isError) {
    const error = servers.error;
    return (
      <ErrorAlert
        title="Couldn't load your servers"
        detail={
          error instanceof ApiError && error.requestId ? `Request ${error.requestId}` : undefined
        }
        onRetry={() => void servers.refetch()}
      >
        {error.message}
      </ErrorAlert>
    );
  }

  const { items, nextCursor } = servers.data;
  if (items.length === 0) {
    return (
      <EmptyState
        title="No servers yet"
        icon={<IconServer2 size={32} aria-hidden />}
        action={<CreateButton />}
      >
        Pick an image and a port. Your server gets its own URL and is ready in a few seconds.
      </EmptyState>
    );
  }

  return (
    <>
      <ServersTable servers={items} />
      {nextCursor ? (
        <Text size="sm" c="dimmed">
          Showing the {PAGE_LIMIT_MAX} newest servers.
        </Text>
      ) : null}
      <Text size="sm" c="dimmed">
        <b>Pending</b>: saved, waiting for the worker · <b>Provisioning</b>: Terraform is running ·{" "}
        <b>Running</b>: ready, the URL works · <b>Failed</b>: the reason is shown under the status.
      </Text>
    </>
  );
}

export function ServersListPage() {
  return (
    <>
      <PageHeader
        title="Servers"
        description="Containers that run your app, each with its own URL."
        actions={<CreateButton />}
      />
      <ServersContent />
    </>
  );
}
