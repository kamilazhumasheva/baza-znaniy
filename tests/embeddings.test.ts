import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { toVectorLiteral } from "@/lib/embeddings";

describe("toVectorLiteral", () => {
  it("форматирует массив чисел в литерал pgvector", () => {
    expect(toVectorLiteral([1, 0.5, -2])).toBe("[1,0.5,-2]");
  });

  it("корректно форматирует пустой вектор", () => {
    expect(toVectorLiteral([])).toBe("[]");
  });
});

describe("getEmbeddingProvider", () => {
  const originalKey = process.env.EMBEDDINGS_API_KEY;

  beforeEach(() => {
    delete process.env.EMBEDDINGS_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.EMBEDDINGS_API_KEY = originalKey;
  });

  it("возвращает null, если EMBEDDINGS_API_KEY не задан", async () => {
    const { getEmbeddingProvider } = await import("@/lib/embeddings");
    expect(getEmbeddingProvider()).toBeNull();
  });
});
