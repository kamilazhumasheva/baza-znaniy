import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isBlocked: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Пользователи</h1>
      <UsersManager initialUsers={users} currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
