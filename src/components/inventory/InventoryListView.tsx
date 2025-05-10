import React, { useState } from "react";
import { useInventory } from "../../context/InventoryContext";
import { InventoryForm } from "./InventoryForm";
import { Modal } from "../ui/Modal";
import { InventoryItem } from "../../types/inventory";
import { InventoryTable } from "./InventoryTable";
import { ErrorDisplay } from "../ui/ErrorDisplay";

export const InventoryListView: React.FC = () => {
  const { error, fetchInventoryItems } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleAddSuccess = (item: InventoryItem) => {
    console.log("New item added successfully:", item);
    // Close the modal
    setShowAddModal(false);
    // Refresh the inventory list to show the new item
    fetchInventoryItems();
    // Add a delayed refresh to ensure database operations complete
    setTimeout(() => {
      console.log("Performing delayed refresh after adding item");
      fetchInventoryItems();
    }, 1000);
  };

  const handleEditSuccess = (item: InventoryItem) => {
    console.log("Item updated successfully:", item);
    // Close the modal
    setShowEditModal(false);
    // Refresh the inventory list to show the updated item
    fetchInventoryItems();
  };

  const handleRetry = () => {
    fetchInventoryItems();
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && <ErrorDisplay message={error} onRetry={handleRetry} />}

      {/* Main content */}
      <InventoryTable onEditItem={handleEditItem} onAddItem={handleAddItem} />

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Inventory Item"
        size="lg"
      >
        <InventoryForm
          onCancel={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Inventory Item"
        size="lg"
      >
        {selectedItem && (
          <InventoryForm
            initialData={selectedItem}
            onCancel={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  );
};
