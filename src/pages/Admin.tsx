import React, { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { useRequests } from "../context/RequestContext";
import { RequestCard } from "../components/requests/RequestCard";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { ExportButton } from "../components/ui/ExportButton";
import { Search, Filter, RefreshCw, ClipboardList, Clock } from "lucide-react";
import { ItemRequest, User } from "../types";
import { userApi } from "../services/api";
import { categories as mockCategories } from "../data/mockData";
import { formatDistanceToNow } from "date-fns";

export const Admin: React.FC = () => {
  const { requests, loading, refreshRequests, lastRefreshed } = useRequests();

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [hasNewData, setHasNewData] = useState<boolean>(false);

  // State for users and categories
  const [users, setUsers] = useState<Record<string, User>>({});
  const [categories, setCategories] = useState<
    Record<string, { name: string }>
  >({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Check for new data when requests changes
  useEffect(() => {
    console.log("Admin requests updated:", requests.length);

    if (requestCount > 0 && requests.length !== requestCount) {
      console.log("New data detected in Admin!");
      setHasNewData(true);
    }

    setRequestCount(requests.length);
  }, [requests]);

  // Set up polling interval
  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(() => {
      console.log("Auto-refreshing admin requests...");
      refreshRequests();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [refreshRequests]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshRequests();
    setHasNewData(false);
    setIsRefreshing(false);
  };

  // Fetch users for export functionality
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const allUsers = await userApi.getAll();

        // Convert array to record for easier lookup
        const usersRecord: Record<string, User> = {};
        allUsers.forEach((user) => {
          usersRecord[user.id] = user;
        });

        setUsers(usersRecord);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Prepare categories for export
  useEffect(() => {
    const categoriesRecord: Record<string, { name: string }> = {};
    mockCategories.forEach((category) => {
      categoriesRecord[category.id] = { name: category.name };
    });
    setCategories(categoriesRecord);
  }, []);

  const filterRequests = (requests: ItemRequest[]) => {
    return requests.filter((request) => {
      // Apply search filter
      const matchesSearch =
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply status filter
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      // Apply priority filter
      const matchesPriority =
        priorityFilter === "all" || request.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const sortRequests = (requests: ItemRequest[]) => {
    return [...requests].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "priority-high":
          const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "priority-low":
          const reversePriorityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
          };
          return (
            reversePriorityOrder[b.priority] - reversePriorityOrder[a.priority]
          );
        default:
          return 0;
      }
    });
  };

  const filteredRequests = sortRequests(filterRequests(requests));

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("pending");
    setPriorityFilter("all");
    setSortOrder("newest");
  };

  if (loading || loadingUsers) {
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Admin Dashboard
          </h1>
          <p className="text-neutral-500 mt-1">
            Review and manage item requests
          </p>
        </div>

        {/* Header for Item Requests */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex">
            <div className="py-4 px-1 border-b-2 border-primary-500 text-primary-600 font-medium text-sm">
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                Item Requests
              </div>
            </div>
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-neutral-500 mr-2" />
              <h2 className="text-lg font-medium">Filters</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>

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
                { value: "draft", label: "Draft" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "fulfilled", label: "Fulfilled" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />

            <Select
              options={[
                { value: "all", label: "All Priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              value={priorityFilter}
              onChange={setPriorityFilter}
            />

            <Select
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "priority-high", label: "Priority (High to Low)" },
                { value: "priority-low", label: "Priority (Low to High)" },
              ]}
              value={sortOrder}
              onChange={setSortOrder}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium">
                {filteredRequests.length} Requests
              </h3>
              <div className="flex items-center text-sm text-neutral-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  Updated{" "}
                  {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
                </span>
              </div>
              <Button
                variant={hasNewData ? "primary" : "outline"}
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                leftIcon={
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isRefreshing
                        ? "animate-spin"
                        : hasNewData
                        ? "animate-pulse"
                        : ""
                    }`}
                  />
                }
              >
                {isRefreshing
                  ? "Refreshing..."
                  : hasNewData
                  ? "New Data Available!"
                  : "Refresh"}
              </Button>
            </div>
            <ExportButton
              requests={filteredRequests}
              users={users}
              categories={categories}
            />
          </div>

          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700">
                No requests found
              </h3>
              <p className="text-neutral-500 mt-2">
                Try adjusting your filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
