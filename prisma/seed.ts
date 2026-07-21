import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  "Продажи",
  "Удержание клиентов",
  "Интернет",
  "Телефония",
  "TV+",
  "Мобильная связь",
  "Тарифы",
  "Акции",
  "Приказы",
  "Скрипты продаж",
  "Обучение",
  "Инструкции",
  "Новости",
];

function slugify(name: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return name
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@company.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Администратор",
      role: "ADMIN",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@company.local" },
    update: {},
    create: {
      email: "employee@company.local",
      passwordHash: await bcrypt.hash("ChangeMe123!", 10),
      name: "Тестовый сотрудник",
      role: "EMPLOYEE",
    },
  });

  const categories: Record<string, { id: string }> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i];
    const slug = slugify(name);
    categories[name] = await prisma.category.upsert({
      where: { slug },
      update: { order: i },
      create: { name, slug, order: i },
    });
  }

  const existingMaterial = await prisma.material.findFirst({
    where: { title: "Переход с Januya 3 на Januya 4" },
  });

  if (!existingMaterial) {
    const material = await prisma.material.create({
      data: {
        title: "Переход с Januya 3 на Januya 4",
        description:
          "Условия и порядок перехода клиента на новый тарифный план Januya 4.",
        categoryId: categories["Тарифы"].id,
        authorId: admin.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
        pinned: true,
      },
    });

    await prisma.faq.create({
      data: {
        question: "Как перейти с Januya 3 на Januya 4?",
        answer:
          "Переход доступен только сотрудникам ЦАП и ЦАП-агентам. ПСС выполнить переход не может.",
        categoryId: categories["Тарифы"].id,
        materialId: material.id,
        status: "PUBLISHED",
      },
    });
  }

  console.log("Seed завершён.");
  console.log(`Администратор: ${adminEmail} / ${adminPassword}`);
  console.log(`Сотрудник: employee@company.local / ChangeMe123! (id: ${employee.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
