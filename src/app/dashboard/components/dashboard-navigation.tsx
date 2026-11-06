"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  Flex,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";

import { logout } from "@/lib/actions/auth";

const navigationLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/expenses", label: "Expenses" },
  { href: "/dashboard/income", label: "Income" },
  { href: "/dashboard/budget", label: "Budget" },
] as const;

function isCurrentPage(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return navigationLinks.map(({ href, label }) => {
    const active = isCurrentPage(pathname, href);

    return (
      <Box
        asChild
        key={href}
        px={3}
        py={2.5}
        borderRadius="lg"
        fontSize="sm"
        fontWeight={active ? "semibold" : "medium"}
        color={active ? "brand.fg" : "fg.muted"}
        bg={active ? "bg.subtle" : "transparent"}
        _hover={{
          bg: "bg.subtle",
          color: "fg",
          textDecoration: "none",
        }}
        aria-current={active ? "page" : undefined}
      >
        <Link href={href} onClick={onNavigate}>
          {label}
        </Link>
      </Box>
    );
  });
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function DashboardNavigation({
  children,
  displayName,
  avatarUrl,
}: {
  children: React.ReactNode;
  displayName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(true);

  return (
    <Flex direction="column" flex="1" minH="100vh" bg="bg.subtle">
      <Box
        as="header"
        bg="bg.panel"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex
          align="center"
          justify="space-between"
          gap={3}
          px={{ base: 3, md: 4 }}
          py={2}
        >
          <Flex align="center" gap={3}>
            <Drawer.Root
              open={sidebarOpen}
              onOpenChange={(details) => setSidebarOpen(details.open)}
              placement="start"
              size="xs"
            >
              <Drawer.Trigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  display={{ base: "inline-flex", md: "none" }}
                  aria-label="Open navigation"
                  borderColor="border"
                  color="fg"
                >
                  <MenuIcon open={false} />
                </Button>
              </Drawer.Trigger>
              <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                  <Drawer.Content bg="bg.panel">
                    <Drawer.Header
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      borderBottomWidth="1px"
                      borderColor="border"
                    >
                      <Drawer.Title fontWeight="bold">Navigation</Drawer.Title>
                      <Drawer.CloseTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Close navigation"
                        >
                          <MenuIcon open />
                        </Button>
                      </Drawer.CloseTrigger>
                    </Drawer.Header>
                    <Drawer.Body p={3}>
                      <Flex
                        as="nav"
                        direction="column"
                        gap={1}
                        aria-label="Main"
                      >
                        <NavigationLinks
                          pathname={pathname}
                          onNavigate={() => setSidebarOpen(false)}
                        />
                      </Flex>
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer.Positioner>
              </Portal>
            </Drawer.Root>
            <Button
              type="button"
              variant="outline"
              size="sm"
              display={{ base: "none", md: "inline-flex" }}
              aria-label={desktopSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={desktopSidebarOpen}
              onClick={() => setDesktopSidebarOpen((isOpen) => !isOpen)}
              borderColor="border"
              color="fg"
            >
              <MenuIcon open={!desktopSidebarOpen} />
            </Button>

            <Link
              href="/dashboard"
              aria-label="Expense Tracker dashboard"
              style={{ textDecoration: "none" }}
            >
              <Flex align="center" gap={2}>
                <Box boxSize="2.5" borderRadius="full" bg="brand.solid" />
                <Text
                  fontWeight="bold"
                  color="fg"
                  fontSize={{ base: "sm", md: "md" }}
                  whiteSpace="nowrap"
                >
                  Expense Tracker
                </Text>
              </Flex>
            </Link>
          </Flex>

          <Menu.Root positioning={{ placement: "bottom-end" }}>
            <Menu.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                borderRadius="full"
                gap={2}
                px={{ base: 1, sm: 3 }}
                minW={0}
                aria-label={`Account menu for ${displayName}`}
              >
                <Avatar.Root size="sm" colorPalette="teal">
                  {avatarUrl ? (
                    <Avatar.Image src={avatarUrl} alt={displayName} />
                  ) : null}
                  <Avatar.Fallback name={displayName || undefined} />
                </Avatar.Root>
                <Text
                  display={{ base: "none", sm: "block" }}
                  maxW="12rem"
                  truncate
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg"
                >
                  {displayName}
                </Text>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  minW="12rem"
                  p={1}
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="lg"
                  shadow="lg"
                  zIndex="dropdown"
                >
                  <Menu.Item asChild value="profile">
                    <Link href="/dashboard/profile">Profile</Link>
                  </Menu.Item>
                  <Menu.Item asChild value="settings">
                    <Link href="/dashboard/settings">Settings</Link>
                  </Menu.Item>
                  <Menu.Separator />
                  <form action={logout}>
                    <Menu.Item asChild value="signout">
                      <button type="submit">Sign out</button>
                    </Menu.Item>
                  </form>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>
      </Box>

      <Flex flex="1" minW={0}>
        {desktopSidebarOpen ? (
          <Box
            as="aside"
            display={{ base: "none", md: "block" }}
            w="15rem"
            flexShrink={0}
            borderRightWidth="1px"
            borderColor="border"
          >
            <Box
              as="nav"
              position="sticky"
              top={0}
              display="flex"
              flexDirection="column"
              gap={1}
              p={3}
              aria-label="Main"
            >
              <NavigationLinks pathname={pathname} />
            </Box>
          </Box>
        ) : null}
        <Box as="main" flex="1" w="full" minW={0}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
