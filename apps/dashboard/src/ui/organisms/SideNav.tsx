import { NavLink, Stack, Text } from "@mantine/core";
import { Link } from "react-router";

export interface NavGroup {
  label: string;
  items: { label: string; href: string; active: boolean }[];
}

interface SideNavProps {
  groups: NavGroup[];
  footer?: string;
}

export function SideNav({ groups, footer }: Readonly<SideNavProps>) {
  return (
    <Stack gap={0} py="sm" component="nav" aria-label="Services">
      {groups.map((group) => (
        <div key={group.label}>
          <Text size="xs" fw={600} c="dimmed" px="md" pt="sm" pb={4}>
            {group.label}
          </Text>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              to={item.href}
              label={item.label}
              active={item.active}
              aria-current={item.active ? "page" : undefined}
            />
          ))}
        </div>
      ))}
      {footer ? (
        <Text size="xs" c="dimmed" px="md" pt="lg">
          {footer}
        </Text>
      ) : null}
    </Stack>
  );
}
