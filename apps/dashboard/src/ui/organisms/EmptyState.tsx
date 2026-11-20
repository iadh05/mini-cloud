import { Card, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

/** One sentence and the next step, instead of a blank page. */
export function EmptyState({ title, children, icon, action }: Readonly<EmptyStateProps>) {
  return (
    <Card withBorder padding="xl" radius="lg">
      <Stack align="center" ta="center" gap="md" py="xl">
        {icon ? (
          <ThemeIcon size={64} radius="lg" variant="light">
            {icon}
          </ThemeIcon>
        ) : null}
        <Title order={2} fz={22}>
          {title}
        </Title>
        <Text c="dimmed" maw={460}>
          {children}
        </Text>
        {action}
      </Stack>
    </Card>
  );
}
