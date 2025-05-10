import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Save, Edit, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/Card";

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfile(user.id, {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        avatarUrl: user.avatarUrl,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect via AuthContext
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
          >
            Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">Your Profile</h1>
          {!isEditing && (
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
          )}
        </div>

        <Card className="animate-slide-up shadow-3d-lg">
          <CardHeader className="bg-gradient-to-r from-white to-secondary-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-500" />
                Profile Information
              </div>
              {isEditing ? (
                <div className="flex items-center text-sm text-primary-500">
                  <Edit className="h-4 w-4 mr-1" />
                  Editing Profile
                </div>
              ) : (
                <div className="flex items-center text-sm text-neutral-500">
                  <User className="h-4 w-4 mr-1" />
                  View Mode
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.name}
                    size="xl"
                    className="shadow-3d-md mb-4"
                  />
                  <p className="text-sm text-neutral-500 text-center mt-2">
                    Role:{" "}
                    <span className="font-semibold capitalize">
                      {user?.role}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400 text-center mt-1">
                    User ID: {user?.id}
                  </p>
                </div>

                <div className="w-full md:w-2/3">
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    {!isEditing && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                        You can now edit your profile information by clicking
                        the "Edit Profile" button.
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full"
                        />
                      ) : (
                        <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                          {user?.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email Address
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full"
                        />
                      ) : (
                        <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                          {user?.email}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Department
                      </label>
                      {isEditing ? (
                        <Input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="Enter your department"
                          className="w-full"
                        />
                      ) : (
                        <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                          {user?.department || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2 pt-2 pb-4">
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<X className="h-4 w-4" />}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    </Layout>
  );
};
