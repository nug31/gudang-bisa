import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  AlertTriangle,
  Clock,
  Warehouse,
  BarChart3,
  TrendingUp,
  Boxes,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useRequests } from "../context/RequestContext";
import { useAuth } from "../context/AuthContext";
import { ItemRequest } from "../types";
import { Button } from "../components/ui/Button";
import { RequestCard } from "../components/requests/RequestCard";
import { Stats } from "../components/dashboard/Stats";
import { ActivityCalendar } from "../components/dashboard/ActivityCalendar";
import { InventoryHealth } from "../components/dashboard/InventoryHealth";
import { FilterBar } from "../components/dashboard/FilterBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Card3D, Card3DHeader, Card3DContent } from "../components/ui/Card3D";
import { DatabaseConnectionTest } from "../components/DatabaseConnectionTest";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests, userRequests, loading } = useRequests();
  const navigate = useNavigate();

  // State for filtered requests - initialize with empty array, will be set in useEffect
  const [filteredRequests, setFilteredRequests] = useState<ItemRequest[]>([]);

  // Handle filter changes
  const handleFilterChange = (filters: any) => {
    // For regular users, only show their own requests
    // For admin/manager, show all requests
    const requestsToFilter =
      user?.role === "admin" || user?.role === "manager"
        ? requests
        : userRequests;

    let filtered = [...requestsToFilter];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchLower) ||
          req.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((req) => {
        // Map category values to actual category names or IDs in your data
        const categoryMap: Record<string, string> = {
          office: "Office Supplies",
          it: "IT Equipment",
          furniture: "Furniture",
        };
        return req.category === categoryMap[filters.category];
      });
    }

    // Apply date range filter (simplified for demo)
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (filters.dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.createdAt);
        return reqDate >= startDate && reqDate <= now;
      });
    }

    setFilteredRequests(filtered);
  };

  // Update filtered requests when requests change
  useEffect(() => {
    // For regular users, only show their own requests
    // For admin/manager, show all requests
    const requestsToFilter =
      user?.role === "admin" || user?.role === "manager"
        ? requests
        : userRequests;
    setFilteredRequests(requestsToFilter);
  }, [requests, userRequests, user?.role]);

  // Mock inventory items for demo
  const inventoryItems = [
    {
      id: "1",
      name: "Dell XPS 13",
      description: "13-inch laptop with Intel Core i7",
      categoryId: "1",
      categoryName: "IT Equipment",
      sku: "DELL-XPS-13",
      quantityAvailable: 2,
      quantityReserved: 1,
      unitPrice: 1299.99,
      location: "Warehouse A",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "HP Monitor 27-inch",
      description: "27-inch 4K monitor",
      categoryId: "1",
      categoryName: "IT Equipment",
      sku: "HP-MON-27",
      quantityAvailable: 3,
      quantityReserved: 1,
      unitPrice: 349.99,
      location: "Warehouse B",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Logitech MX Master",
      description: "Wireless mouse",
      categoryId: "1",
      categoryName: "IT Equipment",
      sku: "LOG-MX-MASTER",
      quantityAvailable: 4,
      quantityReserved: 0,
      unitPrice: 99.99,
      location: "Warehouse A",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Office Paper A4",
      description: "500 sheets of A4 paper",
      categoryId: "2",
      categoryName: "Office Supplies",
      sku: "PAPER-A4-500",
      quantityAvailable: 1,
      quantityReserved: 0,
      unitPrice: 5.99,
      location: "Warehouse C",
      createdAt: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Whiteboard Markers",
      description: "Pack of 4 colors",
      categoryId: "2",
      categoryName: "Office Supplies",
      sku: "MARKER-WB-4PK",
      quantityAvailable: 8,
      quantityReserved: 0,
      unitPrice: 7.99,
      location: "Warehouse C",
      createdAt: new Date().toISOString(),
    },
  ];

  // Get recent requests (last 5)
  const recentRequests = [...userRequests]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  // Get pending requests for admin and manager
  const pendingRequests =
    user?.role === "admin" || user?.role === "manager"
      ? requests
          .filter((req) => req.status === "pending")
          .sort((a, b) => {
            // Sort by critical first, then by creation date
            if (a.priority === "critical" && b.priority !== "critical")
              return -1;
            if (a.priority !== "critical" && b.priority === "critical")
              return 1;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          })
          .slice(0, 5)
      : [];

  // Get critical items for admin and manager
  const criticalRequests =
    user?.role === "admin" || user?.role === "manager"
      ? requests.filter(
          (req) => req.priority === "critical" && req.status === "pending"
        )
      : [];

  const handleNewRequest = () => {
    navigate("/requests/new");
  };

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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-neutral-500 mt-1">
              {userRequests.length > 0
                ? `Welcome back, ${user?.name}!`
                : `Welcome, ${user?.name}!`}
            </p>
          </div>

          <Button
            onClick={handleNewRequest}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            New Order
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="animate-slide-up">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* Stats Section */}
        <div className="animate-slide-up">
          <Stats requests={filteredRequests} inventoryItems={inventoryItems} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Request Activity Calendar */}
          <div className="md:col-span-2">
            <ActivityCalendar requests={filteredRequests} />
          </div>

          {/* Low Stock Items */}
          <div className="md:col-span-2 lg:col-span-1 order-first lg:order-none">
            <InventoryHealth
              lowStockCount={
                inventoryItems.filter((item) => item.quantityAvailable < 5)
                  .length
              }
              healthPercentage={85}
              inventoryItems={inventoryItems}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Orders */}
          <Card3D
            className="animate-slide-up"
            interactive={true}
            hoverEffect={true}
          >
            <Card3DHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Boxes className="h-5 w-5 mr-2 text-primary-400" />
                <h3 className="text-lg font-semibold">Your Recent Orders</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/requests")}
                className="shadow-3d-sm hover:shadow-3d-md transition-all"
              >
                View All
              </Button>
            </Card3DHeader>
            <Card3DContent>
              {recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-neutral-700">
                    No orders yet
                  </h3>
                  <p className="text-neutral-500 mt-1">
                    Create your first inventory order to get started
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 shadow-3d-sm hover:shadow-3d-md transition-all"
                    onClick={handleNewRequest}
                  >
                    Create Order
                  </Button>
                </div>
              )}
            </Card3DContent>
          </Card3D>

          {/* Admin/Manager: Pending Approvals */}
          {(user?.role === "admin" || user?.role === "manager") && (
            <Card3D
              className="animate-slide-up"
              interactive={true}
              hoverEffect={true}
            >
              <Card3DHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary-400" />
                  <h3 className="text-lg font-semibold">Pending Approvals</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(user?.role === "admin" ? "/admin" : "/manager")
                  }
                  className="shadow-3d-sm hover:shadow-3d-md transition-all"
                >
                  View All
                </Button>
              </Card3DHeader>
              <Card3DContent>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-neutral-700">
                      All caught up!
                    </h3>
                    <p className="text-neutral-500 mt-1">
                      No pending orders requiring your approval
                    </p>
                  </div>
                )}
              </Card3DContent>
            </Card3D>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Simple CheckIcon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
