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
