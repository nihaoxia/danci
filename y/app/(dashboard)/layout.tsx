import { Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
