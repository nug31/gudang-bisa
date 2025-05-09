import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useRequests } from "../context/RequestContext";
import { RequestCard } from "../components/requests/RequestCard";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { ItemRequest } from "../types";
import { UserManagement } from "../components/users/UserManagement";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";

export const Manager: React.FC = () => {
  const { requests, loading } = useRequests();

  const [activeTab, setActiveTab] = useState<"requests" | "users">("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [error, setError] = useState<string | null>("Failed to fetch users");

  // Clear error when changing tabs
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  // Filter and sort requests
  const filteredRequests = requests
    .filter((request) => {
      // Status filter
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && request.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          request.title.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-lg text-neutral-500">
            Loading...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            Manager Dashboard
          </h1>

          <div className="flex space-x-2">
            <Button
              variant={activeTab === "requests" ? "primary" : "outline"}
              onClick={() => setActiveTab("requests")}
              leftIcon={<ClipboardList className="h-4 w-4" />}
            >
              Requests
            </Button>
            <Button
              variant={activeTab === "users" ? "primary" : "outline"}
              onClick={() => setActiveTab("users")}
              leftIcon={<Users className="h-4 w-4" />}
            >
              Users
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && activeTab === "users" && (
          <div className="mb-4">
            <ErrorDisplay message={error} onRetry={() => setError(null)} />
          </div>
        )}

        {activeTab === "requests" ? (
          <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-card space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <Select
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                    { value: "fulfilled", label: "Fulfilled" },
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  leftIcon={<Filter className="h-4 w-4" />}
                />

                <Select
                  options={[
                    { value: "all", label: "All Priorities" },
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "critical", label: "Critical" },
                  ]}
                  value={priorityFilter}
                  onChange={(value) => setPriorityFilter(value)}
                />

                <Select
                  options={[
                    { value: "newest", label: "Newest First" },
                    { value: "oldest", label: "Oldest First" },
                  ]}
                  value={sortOrder}
                  onChange={(value) => setSortOrder(value)}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Request List */}
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-card text-center">
                  <p className="text-neutral-500">No requests found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <UserManagement />
        )}
      </div>
    </Layout>
  );
};
