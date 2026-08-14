export interface DocumentSection {
  heading: string;
  content: string;
  /**
   * Неверные варианты ответа, если секция пришла из таблицы-теста.
   * Сохраняются для режима самопроверки — в текст материала не попадают.
   */
  wrongOptions?: string[];
}

export interface ParsedDocument {
  sections: DocumentSection[];
}
