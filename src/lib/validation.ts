import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Название обязательно").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug может содержать только латиницу, цифры и дефис"),
  parentId: z.string().cuid().nullable().optional(),
  order: z.number().int().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const materialSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно").max(300),
  description: z.string().trim().min(1, "Описание обязательно"),
  categoryId: z.string().cuid("Некорректная категория"),
  documentId: z.string().cuid().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  pinned: z.boolean().optional(),
  isNews: z.boolean().optional(),
});

export const materialUpdateSchema = materialSchema.partial();

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Вопрос обязателен").max(500),
  answer: z.string().trim().min(1, "Ответ обязателен"),
  categoryId: z.string().cuid("Некорректная категория"),
  materialId: z.string().cuid().nullable().optional(),
  sourceDocumentId: z.string().cuid().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const faqUpdateSchema = faqSchema.partial();

export const favoriteSchema = z
  .object({
    materialId: z.string().cuid().optional(),
    faqId: z.string().cuid().optional(),
  })
  .refine((v) => Boolean(v.materialId) !== Boolean(v.faqId), {
    message: "Укажите либо materialId, либо faqId",
  });

export const userUpdateSchema = z.object({
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  isBlocked: z.boolean().optional(),
});

export const feedbackSchema = z
  .object({
    kind: z.enum(["HELPFUL", "NOT_HELPFUL", "OUTDATED"]),
    comment: z.string().trim().max(1000).optional(),
    materialId: z.string().cuid().optional(),
    faqId: z.string().cuid().optional(),
  })
  .refine((v) => Boolean(v.materialId) !== Boolean(v.faqId), {
    message: "Укажите либо materialId, либо faqId",
  });

// Логин намеренно не обязан быть email: в компании удобнее заводить
// учётные записи вида «Kamila_admin».
export const userCreateSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Логин должен быть не короче 3 символов")
    .max(120)
    .regex(/^[^\s]+$/, "Логин не должен содержать пробелы"),
  name: z.string().trim().min(1, "Имя обязательно").max(120),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов").max(200),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});
