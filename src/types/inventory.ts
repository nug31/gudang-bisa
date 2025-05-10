export interface Category {
  id: string | number;
  name: string;
  itemCount?: number; // Number of items in this category
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId?: string | number;
  categoryName?: string;
  category?: Category;
  category_id?: string | number; // Added for compatibility with snake_case database fields
  category_name?: string; // Added for compatibility with snake_case database fields
  sku?: string;
  quantity?: number;
  quantityAvailable?: number;
  quantityReserved?: number;
  unitPrice?: number;
  location?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number; // Added for category item counts
}
