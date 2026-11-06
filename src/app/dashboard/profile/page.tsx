import type { Metadata } from "next";
import { connection } from "next/server";
import { Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ProfileForm } from "./profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile · Expense Tracker",
};

export const instant = false;

export default async function ProfilePage() {
  await connection();

  const currentUser = await getCurrentUser();
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
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

  return (
    <Stack gap={6} w="full" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="brand.navy">
          Profile
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Update your personal details.
        </Text>
      </Stack>

      <ProfileForm
        email={user.email}
        initialProfile={{
          firstName: user.profile?.firstName ?? "",
          lastName: user.profile?.lastName ?? "",
          avatarUrl: user.profile?.avatarUrl ?? "",
          currency: user.profile?.currency ?? "USD",
        }}
      />
    </Stack>
  );
}
