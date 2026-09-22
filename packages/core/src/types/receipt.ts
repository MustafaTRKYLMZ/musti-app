export type ReceiptLineDraft = {
  name: string;
  quantity?: number;
  /** e.g. "L" for fuel liters, "pcs" for grocery items */
  unit?: string;
  unitPrice?: number;
  totalAmount?: number;
  productId?: string;
  /** Product catalog category — e.g. "Yakıt" while transaction category is "Ulaşım" */
  productCategory?: string;
};

export type ReceiptDraft = {
  rawText: string;
  storeName: string;
  storeId?: string;
  date: string;
  total: number;
  currency: string;
  /** Shown as transaction item — e.g. "Benzin", not the store name. */
  description: string;
  suggestedCategory?: string;
  lines: ReceiptLineDraft[];
};

export type ParsedReceiptField<T> = {
  value: T;
  confidence: "high" | "medium" | "low";
};

export type ParseReceiptResult = {
  draft: ReceiptDraft;
  hints: {
    store: ParsedReceiptField<string>;
    date: ParsedReceiptField<string>;
    total: ParsedReceiptField<number>;
    currency: ParsedReceiptField<string>;
  };
};
