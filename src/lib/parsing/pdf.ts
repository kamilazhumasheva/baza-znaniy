import pdfParse from "pdf-parse";
import type { DocumentSection, ParsedDocument } from "./types";

// pdf-parse отдаёт только текстовый поток без разметки заголовков,
// поэтому секции определяются эвристически: короткая строка (< 90 символов),
// за которой следует более длинный текст, считается заголовком раздела.
export function sectionsFromText(text: string): DocumentSection[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sections: DocumentSection[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const [first, ...rest] = lines;
    const looksLikeHeading = first.length <= 90 && rest.length > 0;

    if (looksLikeHeading) {
      sections.push({ heading: first, content: rest.join("\n") });
    } else {
      sections.push({ heading: first.slice(0, 80), content: lines.join("\n") });
    }
  }

  return sections;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const { text } = await pdfParse(buffer);
  return { sections: sectionsFromText(text) };
}
