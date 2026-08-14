import { prisma } from "@/lib/db";
import type { ParsedDocument } from "@/lib/parsing";
import { setFaqEmbedding, setMaterialEmbedding } from "@/lib/pipeline/embedContent";

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

  const newMaterials: { id: string; text: string }[] = [];
  const newFaqs: { id: string; text: string }[] = [];

  const { materialsCount, faqsCount } = await prisma.$transaction(async (tx) => {
    let materialsCount = 0;
    let faqsCount = 0;

    for (const section of parsed.sections) {
      if (!section.content.trim()) continue;

      const description = truncate(section.content, 500);
      const material = await tx.material.create({
        data: {
          title: truncate(section.heading || "Без названия", 300),
          description,
          categoryId,
          documentId,
          authorId,
          status: "DRAFT",
        },
      });
      materialsCount++;
      newMaterials.push({ id: material.id, text: `${material.title}\n${description}` });

      const qaPairs = extractQAFromText(section.heading, section.content);
      for (const qa of qaPairs) {
        const answer = qa.answer.trim();
        const faq = await tx.faq.create({
          data: {
            question: truncate(qa.question, 500),
            answer,
            categoryId,
            sourceDocumentId: documentId,
            materialId: material.id,
            status: "DRAFT",
            // Есть только у секций из таблиц-тестов — для режима самопроверки.
            wrongOptions: section.wrongOptions ?? [],
          },
        });
        faqsCount++;
        newFaqs.push({ id: faq.id, text: `${faq.question}\n${answer}` });
      }
    }

    return { materialsCount, faqsCount };
  });

  // Эмбеддинги считаются вне транзакции (сетевой вызов), чтобы не держать её открытой.
  // Если EMBEDDINGS_API_KEY не задан — эти вызовы мгновенно возвращаются, ничего не делая.
  await Promise.allSettled([
    ...newMaterials.map((m) => setMaterialEmbedding(m.id, m.text)),
    ...newFaqs.map((f) => setFaqEmbedding(f.id, f.text)),
  ]);

  return { materialsCount, faqsCount };
}
