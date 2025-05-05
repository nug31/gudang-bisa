import React, { useState, useEffect } from "react";
import { Tag, Save, X } from "lucide-react";
import { Category } from "../../types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

interface CategoryFormProps {
  initialData?: Category;
  onCancel: () => void;
  onSuccess: (category?: Category) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onCancel,
  onSuccess,
}) => {
  const isEdit = !!initialData;
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if user is admin or manager
    if (user?.role !== "admin" && user?.role !== "manager") {
      alert("Only administrators and managers can manage categories");
      return;
    }

    setIsSubmitting(true);

    try {
      const action = isEdit ? "update" : "create";
      const payload = isEdit ? { ...formData, id: initialData.id } : formData;

      console.log("Submitting category form with payload:", {
        action,
        ...payload,
      });

      const response = await fetch("/db/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });

      // Log the raw response for debugging
      console.log("Response status:", response.status);

      // Clone the response to read it twice
      const responseClone = response.clone();

      try {
        // Try to parse as text first to see what's coming back
        const rawText = await responseClone.text();
        console.log("Raw response text:", rawText);

        // If not empty, try to parse as JSON
        let result;
        if (rawText.trim()) {
          result = JSON.parse(rawText);
        }

        if (!response.ok) {
          throw new Error(
            (result && result.message) ||
              `Failed to ${isEdit ? "update" : "create"} category`
          );
        }

        if (result) {
          console.log("Parsed result:", result);
          onSuccess(result);
        } else {
          throw new Error("Empty response received from server");
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error(
          `Failed to parse server response: ${parseError.message}`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEdit ? "updating" : "creating"} category:`,
        error
      );
      alert(
        `Failed to ${isEdit ? "update" : "create"} category: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="space-y-6">
        <Input
          label="Category Name *"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          placeholder="Enter category name"
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide details about this category"
        />
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
          {isEdit ? "Update Category" : "Save Category"}
        </Button>
      </div>
    </form>
  );
};
