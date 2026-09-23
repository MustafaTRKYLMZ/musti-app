export type BookSection = {
    id: string;
    title: string;
    startPage: number;
    endPage?: number | null;
    color?: string | null;
  };