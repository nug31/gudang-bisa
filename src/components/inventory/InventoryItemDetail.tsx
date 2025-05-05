import React from 'react';
import { Box, MapPin, Tag, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface InventoryItem {
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
}

interface InventoryItemDetailProps {
  item: InventoryItem;
}

export const InventoryItemDetail: React.FC<InventoryItemDetailProps> = ({ item }) => {
  const isLowStock = item.quantityAvailable <= 5;
  const isOutOfStock = item.quantityAvailable === 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Box className="mr-2 h-5 w-5 text-primary-500" />
          Inventory Item Details
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-48 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-48 bg-neutral-200 rounded-md flex items-center justify-center">
                <Package className="h-16 w-16 text-neutral-400" />
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                {isOutOfStock ? (
                  <Badge variant="danger">Out of Stock</Badge>
                ) : isLowStock ? (
                  <Badge variant="warning">Low Stock</Badge>
                ) : (
                  <Badge variant="success">In Stock</Badge>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-neutral-500">Available</span>
                <span className="font-medium">{item.quantityAvailable}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-neutral-500">Reserved</span>
                <span className="font-medium">{item.quantityReserved}</span>
              </div>
              
              {item.unitPrice && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Price</span>
                  <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3">
            <h2 className="text-2xl font-semibold text-neutral-900">{item.name}</h2>
            
            <div className="mt-2 flex items-center">
              <Tag className="h-4 w-4 text-neutral-500 mr-2" />
              <span className="text-neutral-600">{item.categoryName}</span>
            </div>
            
            {item.sku && (
              <div className="mt-1 flex items-center">
                <Package className="h-4 w-4 text-neutral-500 mr-2" />
                <span className="text-neutral-600 font-mono">{item.sku}</span>
              </div>
            )}
            
            {item.location && (
              <div className="mt-1 flex items-center">
                <MapPin className="h-4 w-4 text-neutral-500 mr-2" />
                <span className="text-neutral-600">{item.location}</span>
              </div>
            )}
            
            {item.description && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-neutral-700">{item.description}</p>
              </div>
            )}
            
            {isLowStock && !isOutOfStock && (
              <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-warning-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning-700">Low Stock Warning</h4>
                  <p className="text-sm text-warning-600">
                    This item is running low on stock. Only {item.quantityAvailable} units available.
                  </p>
                </div>
              </div>
            )}
            
            {isOutOfStock && (
              <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-error-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-error-700">Out of Stock</h4>
                  <p className="text-sm text-error-600">
                    This item is currently out of stock. {item.quantityReserved > 0 && `${item.quantityReserved} units are reserved.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
