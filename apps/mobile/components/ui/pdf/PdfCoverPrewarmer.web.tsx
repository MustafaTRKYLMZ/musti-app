import React, { FC } from "react";

type Props = {
  pdfUris: string[];
  enabled?: boolean;
  maxToProcess?: number;
  onProgress?: (done: number, total: number) => void;
};

export const PdfCoverPrewarmer: FC<Props> = () => null;
