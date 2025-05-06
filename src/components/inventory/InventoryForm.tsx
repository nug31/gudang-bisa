import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Save, X, AlertTriangle } from "lucide-react";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { useInventory } from "../../context/InventoryContext";
import { InventoryItem } from "../../types/inventory";
import { useCategories } from "../../hooks";

interface InventoryFormProps {
  initialData?: InventoryItem;
  onCancel: () => void;
  onSuccess?: (item: InventoryItem) => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  initialData,
  onCancel,
  onSuccess,
}) => {
  const isEdit = !!initialData;
  const { createInventoryItem, updateInventoryItem } = useInventory();
  const { categories, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    sku: "",
    quantityAvailable: 0,
    quantityReserved: 0,
    location: "",
    imageUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        categoryId: initialData.categoryId,
        sku: initialData.sku || "",
        quantityAvailable: initialData.quantityAvailable,
        quantityReserved: initialData.quantityReserved,
        location: initialData.location || "",
        imageUrl: initialData.imageUrl || "",
      });
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === "" ? 0 : Number(value);

    setFormData((prev) => ({
      ...prev,
      [name]: numberValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
    }));

    // Clear error for this field
    if (errors.categoryId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.categoryId;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (formData.quantityAvailable < 0) {
      newErrors.quantityAvailable = "Quantity cannot be negative";
    }

    if (formData.quantityReserved < 0) {
      newErrors.quantityReserved = "Reserved quantity cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const itemData = {
        ...formData,
      };

      let result;

      if (isEdit && initialData) {
        // Update existing item
        result = await updateInventoryItem({
          id: initialData.id,
          ...itemData,
        });
      } else {
        // Create new item
        result = await createInventoryItem(itemData);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error submitting inventory item:", error);
      alert(
        `Failed to ${isEdit ? "update" : "create"} inventory item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-card p-6 animate-fade-in"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 flex items-center">
          <Package className="mr-2 h-6 w-6 text-primary-500" />
          {isEdit ? "Edit Inventory Item" : "Add New Inventory Item"}
        </h2>
        <p className="text-neutral-500 mt-1">
          {isEdit
            ? "Update the inventory item details below."
            : "Fill out the form below to add a new inventory item."}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Item Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="Enter item name"
            required
          />

          <Select
            label="Category *"
            name="category"
            value={formData.categoryId}
            onChange={handleCategoryChange}
            options={categoryOptions}
            error={errors.categoryId}
            placeholder="Select a category"
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide details about this item"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            placeholder="Stock Keeping Unit"
          />

          <Input
            label="Available Quantity *"
            name="quantityAvailable"
            type="number"
            min="0"
            value={formData.quantityAvailable}
            onChange={handleNumberInputChange}
            error={errors.quantityAvailable}
            required
          />

          <Input
            label="Reserved Quantity"
            name="quantityReserved"
            type="number"
            min="0"
            value={formData.quantityReserved}
            onChange={handleNumberInputChange}
            error={errors.quantityReserved}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Storage location"
          />

          <Input
            label="Image URL"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {formData.quantityAvailable === 0 && (
          <div className="flex items-start p-4 bg-warning-50 border border-warning-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-warning-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-warning-800">
                Out of Stock Warning
              </h4>
              <p className="text-sm text-warning-700 mt-1">
                This item is currently out of stock. Users will not be able to
                request it.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          leftIcon={<X className="h-4 w-4" />}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isEdit ? "Update Item" : "Save Item"}
        </Button>
      </div>
    </form>
  );
};
