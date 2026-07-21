import mammoth from "mammoth";
import * as cheerio from "cheerio";
import type { DocumentSection, ParsedDocument } from "./types";

// Заголовки Word (Heading 1-6) mammoth по умолчанию превращает в <h1>-<h6>,
// это даёт структуру документа без ручного маппинга стилей.
export function sectionsFromHtml(html: string): DocumentSection[] {
  const $ = cheerio.load(html);

  const sections: DocumentSection[] = [];
  let current: DocumentSection | null = null;

  $("body")
    .children()
    .each((_, el) => {
      const tag = el.tagName?.toLowerCase();
      const text = $(el).text().trim();
      if (!text) return;

      if (tag && /^h[1-6]$/.test(tag)) {
        if (current) sections.push(current);
        current = { heading: text, content: "" };
        return;
      }

      if (!current) {
        current = { heading: text.slice(0, 80), content: "" };
      }

      current.content += (current.content ? "\n" : "") + text;
    });

  if (current) sections.push(current);

  return sections;
}

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return { sections: sectionsFromHtml(html) };
}
