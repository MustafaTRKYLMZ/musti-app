export type ShoppingListItem = {
  id: string;
  name: string;
  productId?: string;
  storeId?: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  createdAt: string;
};
