import { describe, expect, it } from "vitest";
import { mergeSearchResults, type SearchResult, type SemanticHit } from "@/lib/search";

function textHit(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    type: "MATERIAL",
    id: "m1",
    title: "Материал",
    snippet: "...",
    categoryId: "c1",
    categoryName: "Категория",
    categorySlug: "kategoriya",
    rank: 0.1,
    sim: 0.2,
    ...overrides,
  };
}

function semanticHit(overrides: Partial<SemanticHit> = {}): SemanticHit {
  return {
    type: "MATERIAL",
    id: "m1",
    title: "Материал",
    snippet: "...",
    categoryId: "c1",
    categoryName: "Категория",
    categorySlug: "kategoriya",
    score: 0.9,
    ...overrides,
  };
}

describe("mergeSearchResults", () => {
  it("без семантических результатов возвращает текстовые как есть", () => {
    const text = [textHit()];
    expect(mergeSearchResults(text, [], 20)).toEqual(text);
  });

  it("без текстовых результатов подмешивает семантические", () => {
    const semantic = [semanticHit({ id: "m2" })];
    const result = mergeSearchResults([], semantic, 20);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m2");
    expect(result[0].rank).toBe(0.9);
    expect(result[0].sim).toBe(0);
  });

  it("для совпадения по id и типу суммирует ранг вместо дублирования", () => {
    const text = [textHit({ id: "m1", rank: 0.1 })];
    const semantic = [semanticHit({ id: "m1", score: 0.5 })];

    const result = mergeSearchResults(text, semantic, 20);

    expect(result).toHaveLength(1);
    expect(result[0].rank).toBeCloseTo(0.6);
  });

  it("не путает MATERIAL и FAQ с одинаковым id", () => {
    const text = [textHit({ id: "x", type: "MATERIAL" })];
    const semantic = [semanticHit({ id: "x", type: "FAQ" })];

    const result = mergeSearchResults(text, semantic, 20);

    expect(result).toHaveLength(2);
  });

  it("сортирует по комбинированному скору rank*2 + sim и обрезает по limit", () => {
    const text = [
      textHit({ id: "low", rank: 0.01, sim: 0 }),
      textHit({ id: "high", rank: 0.9, sim: 0 }),
    ];

    const result = mergeSearchResults(text, [], 1);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("high");
  });
});
