import React, { useState, useEffect } from "react";
import { User } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Avatar } from "../ui/Avatar";
import {
  UserPlus,
  Edit,
  Trash2,
  X,
  Check,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Check if current user has permission to manage users
  // Only managers can manage users
  const hasManagePermission = currentUser?.role === "manager";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    avatarUrl: "",
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "getAll" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string,
    selectName?: string
  ) => {
    // If e is a string, it's coming from the Select component
    if (typeof e === "string" && selectName) {
      setFormData((prev) => ({ ...prev, [selectName]: e }));
    }
    // Otherwise it's a regular input event
    else if (typeof e !== "string") {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      department: "",
      avatarUrl: "",
    });
  };

  // Handle add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user");
      }

      const newUser = await response.json();
      setUsers((prev) => [...prev, newUser]);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Password field is empty when editing
      role: user.role,
      department: user.department || "",
      avatarUrl: user.avatarUrl || "",
    });
  };

  // Handle update user
  const handleUpdateUser = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();

    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          id: userId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const updatedUser = await response.json();
      console.log("Response from server:", updatedUser);

      // Update the users state with the updated user
      setUsers((prev) => {
        const newUsers = prev.map((user) =>
          user.id === userId ? updatedUser : user
        );
        console.log("Updated users state:", newUsers);
        return newUsers;
      });

      setEditingUserId(null);
      resetForm();

      // Force a refresh to ensure the UI updates correctly
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUserId(null);
    resetForm();
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department &&
        user.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user doesn't have permission, show access denied message
  if (!hasManagePermission) {
    return (
      <div className="space-y-6">
        <div className="bg-error-50 border border-error-200 text-error-700 px-6 py-4 rounded-md">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Access Denied</h3>
          </div>
          <p>
            You don't have permission to manage users. Only managers can access
            this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-4">
          {error}
          <button className="float-right" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button
          onClick={() => setShowAddForm((prev) => !prev)}
          leftIcon={showAddForm ? <X size={16} /> : <UserPlus size={16} />}
        >
          {showAddForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Password *
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Note: For demo purposes, all users will use "password" as
                    their password
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Role *
                  </label>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={(value) => handleInputChange(value, "role")}
                    options={[
                      { value: "user", label: "User" },
                      { value: "manager", label: "Manager" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Department
                  </label>
                  <Input
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Avatar URL
                  </label>
                  <Input
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add User</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          <Select
            options={[
              { value: "all", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "manager", label: "Manager" },
              { value: "user", label: "User" },
            ]}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
          />
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-neutral-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    {editingUserId === user.id ? (
                      // Edit mode
                      <td colSpan={5} className="px-6 py-4">
                        <form
                          onSubmit={(e) => handleUpdateUser(e, user.id)}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Name *
                              </label>
                              <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Email *
                              </label>
                              <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Password{" "}
                                {editingUserId
                                  ? "(leave blank to keep current)"
                                  : "*"}
                              </label>
                              <Input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!editingUserId}
                              />
                              <p className="text-xs text-neutral-500 mt-1">
                                Note: For demo purposes, all users will use
                                "password" as their password
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Role *
                              </label>
                              <Select
                                name="role"
                                value={formData.role}
                                onChange={(value) =>
                                  handleInputChange(value, "role")
                                }
                                options={[
                                  { value: "user", label: "User" },
                                  { value: "manager", label: "Manager" },
                                  { value: "admin", label: "Admin" },
                                ]}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Department
                              </label>
                              <Input
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Avatar URL
                              </label>
                              <Input
                                name="avatarUrl"
                                value={formData.avatarUrl}
                                onChange={handleInputChange}
                                placeholder="https://example.com/avatar.jpg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Update User</Button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      // View mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar name={user.name} src={user.avatarUrl} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-primary-100 text-primary-800"
                                : user.role === "manager"
                                ? "bg-success-100 text-success-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {user.role === "admin"
                              ? "Admin"
                              : user.role === "manager"
                              ? "Manager"
                              : "User"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {user.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              leftIcon={<Edit size={16} />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error-600 hover:text-error-900 hover:bg-error-50"
                              onClick={() => handleDeleteUser(user.id)}
                              leftIcon={<Trash2 size={16} />}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
