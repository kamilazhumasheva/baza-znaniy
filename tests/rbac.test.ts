import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

const { requireRole, requireAdmin, requireAuth } = await import("@/lib/rbac");

function session(role: "ADMIN" | "EMPLOYEE") {
  return { user: { id: "user-1", role, name: "Test", email: "t@t.local" } };
}

describe("rbac guards", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("requireAdmin возвращает 401, если пользователь не авторизован", async () => {
    authMock.mockResolvedValue(null);
    const result = await requireAdmin();
    expect(result.error?.status).toBe(401);
  });

  it("requireAdmin возвращает 403, если роль не ADMIN", async () => {
    authMock.mockResolvedValue(session("EMPLOYEE"));
    const result = await requireAdmin();
    expect(result.error?.status).toBe(403);
  });

  it("requireAdmin пропускает пользователя с ролью ADMIN", async () => {
    authMock.mockResolvedValue(session("ADMIN"));
    const result = await requireAdmin();
    expect(result.error).toBeUndefined();
    expect(result.session?.user.role).toBe("ADMIN");
  });

  it("requireAuth пропускает и ADMIN, и EMPLOYEE", async () => {
    authMock.mockResolvedValue(session("EMPLOYEE"));
    const result = await requireAuth();
    expect(result.error).toBeUndefined();
  });

  it("requireRole со списком ролей отклоняет роль вне списка", async () => {
    authMock.mockResolvedValue(session("EMPLOYEE"));
    const result = await requireRole(["ADMIN"]);
    expect(result.error?.status).toBe(403);
  });
});
