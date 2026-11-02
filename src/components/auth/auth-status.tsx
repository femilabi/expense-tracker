import Link from "next/link";
import { connection } from "next/server";
import { Button, Flex, Text } from "@chakra-ui/react";

import { auth } from "@/auth";
import { logout } from "@/lib/actions/auth";

const buttonStyles = {
  borderRadius: "full",
  h: 12,
  px: 7,
  fontSize: "sm",
  fontWeight: "medium",
} as const;

export default async function AuthStatus() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    return (
      <Flex
        gap={3}
        direction={{ base: "column", sm: "row" }}
        w={{ base: "full", sm: "auto" }}
      >
        <Button
          asChild
          {...buttonStyles}
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.hover" }}
        >
          <Link href="/signup">Get started</Link>
        </Button>
        <Button
          asChild
          {...buttonStyles}
          bg="bg.panel"
          color="fg"
          borderWidth="1px"
          borderColor="border"
          _hover={{ bg: "bg.subtle" }}
        >
          <Link href="/login">Log in</Link>
        </Button>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap={4} direction={{ base: "column", sm: "row" }}>
      <Text fontSize="sm" color="fg.muted">
        Signed in as{" "}
        <Text as="span" fontWeight="semibold" color="fg">
          {session.user.name ?? session.user.email}
        </Text>
      </Text>
      <Flex gap={3} direction={{ base: "column", sm: "row" }}>
        <Button
          asChild
          {...buttonStyles}
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.hover" }}
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <form action={logout}>
          <Button
            type="submit"
            {...buttonStyles}
            bg="bg.panel"
            color="fg"
            borderWidth="1px"
            borderColor="border"
            _hover={{ bg: "bg.subtle" }}
          >
            Sign out
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}
