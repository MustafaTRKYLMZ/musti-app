export type TextBook = {
    id: string;
    title: string;
    sourcePdfUri: string | null;
    createdAt: number;
    pages: Array<{
      page: number;
      text: string;
      lines: string[];
    }>;
    fullText: string;
  };
  