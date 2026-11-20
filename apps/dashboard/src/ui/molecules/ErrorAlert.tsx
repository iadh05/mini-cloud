import { Alert, Button, Group, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface ErrorAlertProps {
  title: string;
  children: ReactNode;
  /** Shown as small print, for example a request id to quote in a bug report. */
  detail?: string | undefined;
  onRetry?: (() => void) | undefined;
}

export function ErrorAlert({ title, children, detail, onRetry }: Readonly<ErrorAlertProps>) {
  return (
    <Alert color="red" title={title} icon={<IconAlertTriangle aria-hidden />} role="alert">
      <Text size="sm">{children}</Text>
      {detail ? (
        <Text size="xs" c="dimmed" mt={4} ff="monospace">
          {detail}
        </Text>
      ) : null}
      {onRetry ? (
        <Group mt="sm">
          <Button size="xs" variant="white" color="red" onClick={onRetry}>
            Try again
          </Button>
        </Group>
      ) : null}
    </Alert>
  );
}
