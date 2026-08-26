import { asc } from "drizzle-orm";

import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireSuperAdminPage } from "@/lib/session";

export default async function AdminUsersPage() {
  const user = await requireSuperAdminPage();

  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  const initialUsers = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <AdminUsersManager
      initialUsers={initialUsers}
      currentUserId={user.id}
    />
  );
}
