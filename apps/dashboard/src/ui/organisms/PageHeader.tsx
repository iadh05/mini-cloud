import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Small trail above the title, for example "Servers / Create". */
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumb, actions }: Readonly<PageHeaderProps>) {
  return (
    <Group justify="space-between" align="flex-end" gap="md">
      <Stack gap={4}>
        {breadcrumb ? (
          <Text size="sm" c="dimmed">
            {breadcrumb}
          </Text>
        ) : null}
        <Title order={1} fz={28}>
          {title}
        </Title>
        {description ? <Text c="dimmed">{description}</Text> : null}
      </Stack>
      {actions ? <Group gap="sm">{actions}</Group> : null}
    </Group>
  );
}
