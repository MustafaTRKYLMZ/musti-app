/** Minimal ref surface used by the PDF reader (avoids importing react-native-pdf on web). */
export type PdfRef = {
  setPage: (page: number) => void;
};
