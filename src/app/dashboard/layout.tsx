import { DashboardShell } from "./components/dashboard-shell";

export const instant = false;

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return <DashboardShell>{children}</DashboardShell>;
}
