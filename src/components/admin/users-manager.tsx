"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/client-api";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  isBlocked: boolean;
  createdAt: string | Date;
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);

  async function updateUser(id: string, data: Partial<Pick<UserRow, "role" | "isBlocked">>) {
    setError(null);
    try {
      const updated = await apiRequest<UserRow>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Имя</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Роль</th>
              <th className="px-4 py-2 font-medium">Статус</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2 text-foreground">{u.name}</td>
                <td className="px-4 py-2 text-muted">{u.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => updateUser(u.id, { role: e.target.value as "ADMIN" | "EMPLOYEE" })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="EMPLOYEE">Сотрудник</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-muted">{u.isBlocked ? "Заблокирован" : "Активен"}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    disabled={u.id === currentUserId}
                    onClick={() => updateUser(u.id, { isBlocked: !u.isBlocked })}
                    className="text-sm text-accent hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
