import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Filter,
  Package,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useRequests } from "../context/RequestContext";
import { RequestCard } from "../components/requests/RequestCard";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { ItemRequest } from "../types";
import { formatDistanceToNow } from "date-fns";

export const RequestList: React.FC = () => {
  const { userRequests, loading, refreshRequests, lastRefreshed } =
    useRequests();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [hasNewData, setHasNewData] = useState<boolean>(false);

  // Check for new data when userRequests changes
  useEffect(() => {
    console.log("User requests updated:", userRequests.length);

    if (requestCount > 0 && userRequests.length !== requestCount) {
      console.log("New data detected!");
      setHasNewData(true);
    }

    setRequestCount(userRequests.length);
  }, [userRequests]);

  // Set up polling interval
  useEffect(() => {
    // Poll every 5 seconds
    const interval = setInterval(() => {
      console.log("Auto-refreshing requests...");
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

  const handleNewRequest = () => {
    navigate("/requests/new");
  };

  const filterRequests = (requests: ItemRequest[]) => {
    return requests.filter((request) => {
      // Apply search filter
      const matchesSearch =
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply status filter
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
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

  const filteredRequests = sortRequests(filterRequests(userRequests));

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Orders</h1>
            <p className="text-neutral-500 mt-1">
              Manage and track all your inventory orders
            </p>
          </div>

          <Button
            onClick={handleNewRequest}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            New Order
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-card space-y-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-neutral-500 mr-2" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Search orders..."
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
          </div>

          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-700">
                No orders found
              </h3>
              <p className="text-neutral-500 mt-2 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Create your first inventory order to get started."}
              </p>
              <Button onClick={handleNewRequest}>Create New Order</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
