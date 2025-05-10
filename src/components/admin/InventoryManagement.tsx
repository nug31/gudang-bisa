import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Tag, AlertTriangle, Warehouse, BarChart3, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useInventory } from '../../context/InventoryContext';
import { useCategories } from '../../hooks/useCategories';
import { Modal } from '../ui/Modal';
import { InventoryForm } from '../inventory/InventoryForm';
import { CategoryForm } from '../inventory/CategoryForm';

export const InventoryManagement: React.FC = () => {
  const { inventoryItems, loading: inventoryLoading } = useInventory();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  
  // Calculate inventory stats
  const totalItems = inventoryItems.length;
  const totalCategories = categories.length;
  const lowStockItems = inventoryItems.filter(item => item.quantityAvailable < 10).length;
  const outOfStockItems = inventoryItems.filter(item => item.quantityAvailable === 0).length;
  
  const handleAddItemSuccess = () => {
    setShowAddItemModal(false);
  };
  
  const handleAddCategorySuccess = () => {
    setShowAddCategoryModal(false);
  };
  
  if (inventoryLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-neutral-900">Inventory Management</h2>
        
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddItemModal(true)}
          >
            Add Item
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Tag className="h-4 w-4" />}
            onClick={() => setShowAddCategoryModal(true)}
          >
            Add Category
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 mr-3">
                <Package className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Items</p>
                <p className="text-2xl font-bold text-neutral-900">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-50 mr-3">
                <Tag className="h-5 w-5 text-secondary-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Categories</p>
                <p className="text-2xl font-bold text-neutral-900">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning-50 mr-3">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Low Stock</p>
                <p className="text-2xl font-bold text-neutral-900">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error-50 mr-3">
                <AlertTriangle className="h-5 w-5 text-error-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Out of Stock</p>
                <p className="text-2xl font-bold text-neutral-900">{outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/inventory">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 mr-3">
                  <Warehouse className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-neutral-900">Inventory Management</p>
                  <p className="text-sm text-neutral-500">Manage all inventory items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/inventory/low-stock">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning-50 mr-3">
                  <AlertTriangle className="h-5 w-5 text-warning-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-neutral-900">Low Stock Items</p>
                  <p className="text-sm text-neutral-500">View and manage low stock items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/inventory?tab=categories">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-50 mr-3">
                  <Tag className="h-5 w-5 text-secondary-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-neutral-900">Categories</p>
                  <p className="text-sm text-neutral-500">Manage inventory categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add New Inventory Item"
        size="lg"
      >
        <InventoryForm
          onCancel={() => setShowAddItemModal(false)}
          onSuccess={handleAddItemSuccess}
        />
      </Modal>
      
      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add New Category"
      >
        <CategoryForm
          onCancel={() => setShowAddCategoryModal(false)}
          onSuccess={handleAddCategorySuccess}
        />
      </Modal>
    </div>
  );
};
