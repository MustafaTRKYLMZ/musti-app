import type { ReceiptFrameRect } from "./receiptFrame";

export type ReceiptCaptureMeta = {
  previewWidth: number;
  previewHeight: number;
  photoWidth: number;
  photoHeight: number;
  frame: ReceiptFrameRect;
};

export type ReceiptCapture = {
  uri: string;
  meta?: ReceiptCaptureMeta | null;
};
