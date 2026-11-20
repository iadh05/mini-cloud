import { Anchor, Group } from "@mantine/core";
import { IconCloud } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { color } from "../tokens/index.ts";

interface TopBarProps {
  title: string;
  homeHref: string;
  /** Left of the brand, for example the menu button on small screens. */
  start?: ReactNode;
}

export function TopBar({ title, homeHref, start }: Readonly<TopBarProps>) {
  return (
    <Group h="100%" px="md" gap="sm" bg={color.topBar} wrap="nowrap">
      {start}
      <Anchor
        component={Link}
        to={homeHref}
        underline="never"
        c="white"
        fw={600}
        fz="md"
        display="flex"
        style={{ alignItems: "center", gap: 8 }}
      >
        <IconCloud size={22} color={color.topBarAccent} aria-hidden />
        {title}
      </Anchor>
    </Group>
  );
}
