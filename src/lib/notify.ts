import { prisma } from "@/lib/db";

export async function notifyEmployees(message: string, link: string) {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isBlocked: false },
    select: { id: true },
  });

  if (employees.length === 0) return;

  await prisma.notification.createMany({
    data: employees.map((u) => ({ userId: u.id, message, link })),
  });
}
