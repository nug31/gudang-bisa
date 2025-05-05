import React from "react";
import { Package, Clock, CheckCircle, AlertTriangle, Box } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { ItemRequest } from "../../types";

interface StatsProps {
  requests: ItemRequest[];
  inventoryItems?: any[]; // Add inventory items prop
}

export const Stats: React.FC<StatsProps> = ({
  requests,
  inventoryItems = [],
}) => {
  const pendingRequests = requests.filter(
    (req) => req.status === "pending"
  ).length;

  const approvedRequests = requests.filter(
    (req) => req.status === "approved"
  ).length;

  const fulfilledRequests = requests.filter(
    (req) => req.status === "fulfilled"
  ).length;

  // Calculate low stock items (for demo purposes)
  const lowStockItems = inventoryItems.filter(
    (item) => (item.quantityAvailable || 0) < 5
  ).length;

  const stats = [
    {
      title: "Pending Requests",
      value: pendingRequests,
      icon: <Box className="h-5 w-5" />,
      color: "text-warning-500",
      bg: "bg-warning-50",
    },
    {
      title: "Approved Requests",
      value: approvedRequests,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-success-500",
      bg: "bg-success-50",
    },
    {
      title: "Items Fulfilled",
      value: fulfilledRequests,
      icon: <Package className="h-5 w-5" />,
      color: "text-primary-500",
      bg: "bg-primary-50",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-accent-500",
      bg: "bg-accent-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="hover:shadow-3d-md transition-all hover:translate-y-[-4px] group"
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div
                className={`p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-4 rounded-md ${stat.bg} shadow-3d-sm group-hover:shadow-3d-md transition-all`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold mt-1 group-hover:text-primary-500 transition-colors">
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
