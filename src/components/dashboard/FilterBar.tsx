import React, { useState } from "react";
import { Search, Filter, Calendar, X } from "lucide-react";
import { Card3D, Card3DContent } from "../ui/Card3D";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface FilterBarProps {
  onFilterChange?: (filters: {
    search: string;
    dateRange: string;
    category: string;
    status: string;
  }) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "all",
    category: "all",
    status: "all",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      search: "",
      dateRange: "all",
      category: "all",
      status: "all",
    };
    setFilters(resetFilters);
    onFilterChange?.(resetFilters);
  };

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "office", label: "Office Supplies" },
    { value: "it", label: "IT Equipment" },
    { value: "furniture", label: "Furniture" },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "fulfilled", label: "Fulfilled" },
  ];

  return (
    <Card3D depth="sm" className="mb-6">
      <Card3DContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Search and toggle */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:items-center sm:space-x-2">
            <div className="flex-grow">
              <Input
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">
                  {isExpanded ? "Hide" : "Show"}
                </span>
              </Button>
              {(filters.dateRange !== "all" ||
                filters.category !== "all" ||
                filters.status !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-neutral-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expanded filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
              <div>
                <Select
                  label="Date Range"
                  options={dateRangeOptions}
                  value={filters.dateRange}
                  onChange={(value) => handleFilterChange("dateRange", value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Select
                  label="Category"
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => handleFilterChange("category", value)}
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <Select
                  label="Status"
                  options={statusOptions}
                  value={filters.status}
                  onChange={(value) => handleFilterChange("status", value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Active filters display */}
          {(filters.dateRange !== "all" ||
            filters.category !== "all" ||
            filters.status !== "all") && (
            <div className="flex flex-wrap gap-2 pt-2">
              {filters.dateRange !== "all" && (
                <div className="bg-primary-50 text-primary-700 text-xs py-1 px-2 rounded-full flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {
                    dateRangeOptions.find((o) => o.value === filters.dateRange)
                      ?.label
                  }
                  <button
                    className="ml-1 text-primary-500 hover:text-primary-700"
                    onClick={() => handleFilterChange("dateRange", "all")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.category !== "all" && (
                <div className="bg-primary-50 text-primary-700 text-xs py-1 px-2 rounded-full flex items-center">
                  {
                    categoryOptions.find((o) => o.value === filters.category)
                      ?.label
                  }
                  <button
                    className="ml-1 text-primary-500 hover:text-primary-700"
                    onClick={() => handleFilterChange("category", "all")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.status !== "all" && (
                <div className="bg-primary-50 text-primary-700 text-xs py-1 px-2 rounded-full flex items-center">
                  {statusOptions.find((o) => o.value === filters.status)?.label}
                  <button
                    className="ml-1 text-primary-500 hover:text-primary-700"
                    onClick={() => handleFilterChange("status", "all")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card3DContent>
    </Card3D>
  );
};
