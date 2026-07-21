export interface DocumentSection {
  heading: string;
  content: string;
}

export interface ParsedDocument {
  sections: DocumentSection[];
}
