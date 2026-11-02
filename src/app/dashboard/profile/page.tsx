import type { Metadata } from "next";
import { connection } from "next/server";
import { Avatar, Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile · Expense Tracker",
};

export const instant = false;

const joinedDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export default async function ProfilePage() {
  await connection();

  const currentUser = await getCurrentUser();
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          currency: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const name =
    [user.profile?.firstName, user.profile?.lastName]
      .filter(Boolean)
      .join(" ") || user.name;

  return (
    <Stack gap={6} maxW="3xl">
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="brand.navy">
          Profile
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Your account information.
        </Text>
      </Stack>

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="brand.mist"
        borderRadius="2xl"
        px={{ base: 6, sm: 8 }}
        py={8}
      >
        <Stack gap={8}>
          <Flex align="center" gap={5}>
            <Avatar.Root size="2xl" colorPalette="teal">
              {user.profile?.avatarUrl ? (
                <Avatar.Image src={user.profile.avatarUrl} alt={name} />
              ) : null}
              <Avatar.Fallback name={name} />
            </Avatar.Root>
            <Stack gap={1} minW={0}>
              <Heading as="h2" size="lg" color="brand.navy">
                {name}
              </Heading>
              <Text color="brand.slate" fontSize="sm" overflowWrap="anywhere">
                {user.email}
              </Text>
            </Stack>
          </Flex>

          <Box
            as="dl"
            display="grid"
            gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }}
            gap={6}
          >
            <Stack gap={1}>
              <Text as="dt" color="brand.slate" fontSize="sm">
                First name
              </Text>
              <Text as="dd" color="brand.navy" fontWeight="medium">
                {user.profile?.firstName || "Not provided"}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text as="dt" color="brand.slate" fontSize="sm">
                Last name
              </Text>
              <Text as="dd" color="brand.navy" fontWeight="medium">
                {user.profile?.lastName || "Not provided"}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text as="dt" color="brand.slate" fontSize="sm">
                Preferred currency
              </Text>
              <Text as="dd" color="brand.navy" fontWeight="medium">
                {user.profile?.currency ?? "USD"}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text as="dt" color="brand.slate" fontSize="sm">
                Member since
              </Text>
              <Text as="dd" color="brand.navy" fontWeight="medium">
                {joinedDateFormatter.format(user.createdAt)}
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
