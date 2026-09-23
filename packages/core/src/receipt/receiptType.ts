export type ReceiptScanType = "market" | "fuel" | "restaurant";

export type ParseReceiptOptions = {
  receiptType?: ReceiptScanType;
  userOcrCorrections?: Array<{ from: string; to: string }>;
};
