export type BookProgress = {
    uri: string;
    name: string;
    lastPage: number;
    totalPages?: number;
    updatedAt: string;
    lastOpenedAt?: string;
  };