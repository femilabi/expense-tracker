import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getServerSession } from "@/lib/session";

export const instant = false;

export default async function Home() {
  await connection();

  const session = await getServerSession();

  redirect(session?.user?.id ? "/dashboard" : "/login");
}
