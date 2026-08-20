import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { UserAdminRow } from "@/components/admin/user-admin-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { listRecentUsers } from "@/lib/services/stats";

export const metadata: Metadata = { title: "Users & roles" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/users");
  if (!hasPermission(user.role, "admin:manage_users")) redirect("/");

  const users = await listRecentUsers();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Users" }]} />
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Users &amp; roles</h1>
      <Card>
        <CardHeader>
          <CardTitle>Latest {users.length} users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase">
                <th scope="col" className="py-2 pr-4 font-medium">User</th>
                <th scope="col" className="py-2 pr-4 font-medium">Reputation</th>
                <th scope="col" className="py-2 pr-4 font-medium">Role</th>
                <th scope="col" className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((row) => (
                <UserAdminRow
                  key={row.id}
                  user={{
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                    status: row.status,
                    reputation: row.reputation,
                  }}
                  isSelf={row.id === user.id}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
