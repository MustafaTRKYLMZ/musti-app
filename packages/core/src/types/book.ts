 export type BookId = string;

export type BookFormat = "pdf" | "epub" | "paper" | "other";

export interface Book {
  id: BookId;
  title: string;
  author?: string;
  totalPages: number;
  currentPage: number;
  format: BookFormat;
  languageCode?: string; // e.g. "ar", "en", "tr"
  fileUri?: string; // optional, for digital books
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}
