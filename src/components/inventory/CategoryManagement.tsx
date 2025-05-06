import React, { useState } from "react";
import { Category } from "../../types";
import { useCategories } from "../../context/CategoryContext";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import { Modal } from "../ui/Modal";

export const CategoryManagement: React.FC = () => {
  const { fetchCategories } = useCategories();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchCategories();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchCategories();
  };

  return (
    <div className="animate-fade-in">
      <CategoryList
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
      />

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Category"
        size="md"
      >
        <CategoryForm
          onCancel={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Category"
        size="md"
      >
        {selectedCategory && (
          <CategoryForm
            initialData={selectedCategory}
            onCancel={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  );
};
