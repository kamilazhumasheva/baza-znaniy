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

  const [adding, setAdding] = useState(false);
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setCreating(true);
    try {
      const user = await apiRequest<UserRow>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email: login.trim(), name: name.trim(), password, role }),
      });
      setUsers((prev) => [user, ...prev]);
      setCreated(`Пользователь «${user.email}» создан`);
      setLogin("");
      setName("");
      setPassword("");
      setRole("EMPLOYEE");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

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
      {adding ? (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Логин</label>
              <input
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Kamila_admin"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Имя сотрудника</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Камила Жумашева"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Пароль (от 8 символов)</label>
              <input
                required
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Роль</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "EMPLOYEE")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="EMPLOYEE">Сотрудник</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted">
            Логин может быть обычным именем, необязательно почтой. Передайте пароль сотруднику —
            посмотреть его позже будет нельзя, только задать новый.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {creating ? "Создание..." : "Создать"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          + Новый пользователь
        </button>
      )}

      {created && <p className="text-sm text-accent">{created}</p>}
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
