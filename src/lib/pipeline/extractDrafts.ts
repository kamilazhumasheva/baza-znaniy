import { prisma } from "@/lib/db";
import type { ParsedDocument } from "@/lib/parsing";

export interface QAPair {
  question: string;
  answer: string;
}

function truncate(text: string, max: number) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Эвристическое извлечение пар «вопрос — ответ» из текста секции документа.
 * Точка расширения: заменить тело функции на вызов LLM (с сохранением сигнатуры),
 * когда появится доступ к провайдеру — остальной пайплайн менять не придётся.
 */
export function extractQAFromText(heading: string, content: string): QAPair[] {
  const trimmedHeading = heading.trim();
  const trimmedContent = content.trim();

  if (trimmedHeading.endsWith("?") && trimmedContent) {
    return [{ question: trimmedHeading, answer: trimmedContent }];
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const pairs: QAPair[] = [];
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];

  const flush = () => {
    if (currentQuestion && currentAnswer.length > 0) {
      pairs.push({ question: currentQuestion, answer: currentAnswer.join(" ") });
    }
  };

  for (const line of lines) {
    const looksLikeQuestion = line.length <= 300 && /\?\s*$/.test(line);
    if (looksLikeQuestion) {
      flush();
      currentQuestion = line;
      currentAnswer = [];
    } else if (currentQuestion) {
      currentAnswer.push(line);
    }
  }
  flush();

  return pairs;
}

export async function generateDraftsFromDocument(params: {
  documentId: string;
  categoryId: string;
  authorId: string;
  parsed: ParsedDocument;
}) {
  const { documentId, categoryId, authorId, parsed } = params;

  return prisma.$transaction(async (tx) => {
    let materialsCount = 0;
    let faqsCount = 0;

    for (const section of parsed.sections) {
      if (!section.content.trim()) continue;

      const material = await tx.material.create({
        data: {
          title: truncate(section.heading || "Без названия", 300),
          description: truncate(section.content, 500),
          categoryId,
          documentId,
          authorId,
          status: "DRAFT",
        },
      });
      materialsCount++;

      const qaPairs = extractQAFromText(section.heading, section.content);
      for (const qa of qaPairs) {
        await tx.faq.create({
          data: {
            question: truncate(qa.question, 500),
            answer: qa.answer.trim(),
            categoryId,
            sourceDocumentId: documentId,
            materialId: material.id,
            status: "DRAFT",
          },
        });
        faqsCount++;
      }
    }

    return { materialsCount, faqsCount };
  });
}
