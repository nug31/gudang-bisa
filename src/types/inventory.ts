export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  sku?: string;
  quantityAvailable: number;
  quantityReserved: number;
  unitPrice?: number;
  location?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
