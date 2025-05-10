import React, { useState } from "react";
import { Category } from "../../types";
import { useCategories } from "../../hooks/useCategories";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";

export const CategoryManagement: React.FC = () => {
  const { fetchCategories } = useCategories();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Check if user is admin or manager
  const isAdminOrManager = user
    ? user.role === "admin" || user.role === "manager"
    : false;

  const handleAddCategory = () => {
    if (!isAdminOrManager) {
      alert("Only administrators and managers can add categories");
      return;
    }
    setSelectedCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (category: Category) => {
    if (!isAdminOrManager) {
      alert("Only administrators and managers can edit categories");
      return;
    }
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
