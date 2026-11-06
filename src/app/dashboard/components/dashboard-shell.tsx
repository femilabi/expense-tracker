import { connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

import { DashboardNavigation } from "./dashboard-navigation";

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const user = await getCurrentUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true, avatarUrl: true },
  });
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user.name;

  return (
    <DashboardNavigation
      displayName={displayName}
      avatarUrl={profile?.avatarUrl ?? null}
    >
      {children}
    </DashboardNavigation>
  );
}
