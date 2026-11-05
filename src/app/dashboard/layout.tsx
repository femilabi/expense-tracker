import Link from "next/link";
import { connection } from "next/server";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Link as ChakraLink,
  Text,
} from "@chakra-ui/react";

import { logout } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const instant = false;

const navLinkStyles = {
  px: 3,
  py: 2,
  borderRadius: "full",
  fontSize: "sm",
  fontWeight: "medium",
  color: "fg.muted",
  _hover: {
    bg: "bg.subtle",
    color: "fg",
    textDecoration: "none",
  },
} as const;

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  await connection();

  const user = await getCurrentUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true },
  });
  const displayName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Flex direction="column" flex="1" bg="bg.subtle">
      <Box
        as="header"
        bg="bg.panel"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          wrap="wrap"
          maxW="7xl"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={3}
        >
          <Flex align="center" gap={{ base: 2, md: 6 }}>
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

            <Flex as="nav" align="center" gap={1} aria-label="Main">
              <ChakraLink
                asChild
                {...navLinkStyles}
                bg="bg.subtle"
                color="brand.fg"
                aria-current="page"
              >
                <Link href="/dashboard">Dashboard</Link>
              </ChakraLink>
              <ChakraLink asChild {...navLinkStyles}>
                <Link href="/expenses">Expenses</Link>
              </ChakraLink>
              <ChakraLink asChild {...navLinkStyles}>
                <Link href="/income">Income</Link>
              </ChakraLink>
              <ChakraLink asChild {...navLinkStyles}>
                <Link href="/budget">Budget</Link>
              </ChakraLink>
              <ChakraLink asChild {...navLinkStyles}>
                <Link href="/dashboard/profile">Profile</Link>
              </ChakraLink>
              <ChakraLink asChild {...navLinkStyles}>
                <Link href="/dashboard/settings">Settings</Link>
              </ChakraLink>
            </Flex>
          </Flex>

          <Flex align="center" gap={3}>
            <Flex align="center" gap={2} minW={0}>
              <Avatar.Root size="sm" colorPalette="teal">
                <Avatar.Fallback name={displayName || undefined} />
              </Avatar.Root>
              {displayName ? (
                <Text
                  fontSize="sm"
                  color="fg"
                  fontWeight="medium"
                  maxW="12rem"
                  truncate
                  display={{ base: "none", md: "block" }}
                >
                  {displayName}
                </Text>
              ) : null}
            </Flex>

            <form action={logout}>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                borderRadius="full"
                borderColor="border"
                color="fg"
                fontWeight="medium"
                _hover={{ bg: "bg.subtle" }}
              >
                Sign out
              </Button>
            </form>
          </Flex>
        </Flex>
      </Box>

      <Box
        as="main"
        flex="1"
        w="full"
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 10 }}
      >
        {children}
      </Box>
    </Flex>
  );
}
