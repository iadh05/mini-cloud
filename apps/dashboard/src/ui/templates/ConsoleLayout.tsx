import { AppShell, Burger, Container, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ReactNode } from "react";
import { color, layout } from "../tokens/index.ts";

interface ConsoleLayoutProps {
  /** Renders the top bar; `menuButton` opens the navigation on small screens. */
  topBar: (menuButton: ReactNode) => ReactNode;
  sideNav: ReactNode;
  children: ReactNode;
}

/** Top bar, service navigation on the left, page content in the middle. */
export function ConsoleLayout({ topBar, sideNav, children }: Readonly<ConsoleLayoutProps>) {
  const [opened, { toggle }] = useDisclosure(false);
  const burger = (
    <Burger
      opened={opened}
      onClick={toggle}
      hiddenFrom="sm"
      size="sm"
      color="white"
      aria-label={opened ? "Close navigation" : "Open navigation"}
    />
  );
  return (
    <AppShell
      header={{ height: layout.topBarHeight }}
      navbar={{
        width: layout.sideNavWidth,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      bg={color.page}
    >
      <AppShell.Header withBorder={false}>{topBar(burger)}</AppShell.Header>
      <AppShell.Navbar>{sideNav}</AppShell.Navbar>
      <AppShell.Main>
        <Container size={layout.pageMaxWidth} py="lg" px="lg">
          <Stack gap="md">{children}</Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
