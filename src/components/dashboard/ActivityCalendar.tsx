import React, { useState } from "react";
import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Card3D, Card3DContent, Card3DHeader } from "../ui/Card3D";
import { ItemRequest } from "../../types";
import { Button } from "../ui/Button";

interface ActivityCalendarProps {
  requests: ItemRequest[];
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  requests,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState<{
    date: Date;
    x: number;
    y: number;
  } | null>(null);

  // Get current week dates based on currentDate
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start from Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Format date range for display
  const dateRangeText = (() => {
    try {
      if (!Array.isArray(weekDays) || weekDays.length < 7) {
        return "Current Week";
      }
      return `${format(weekDays[0], "MMM d")} - ${format(
        weekDays[6],
        "MMM d"
      )}`;
    } catch (e) {
      console.error("Error formatting date range:", e);
      return "Current Week";
    }
  })();

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    setCurrentDate(addDays(startDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(startDate, 7));
  };

  // Get requests by day
  const getRequestsByDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Filter requests for the given date
    return Array.isArray(requests)
      ? requests.filter((req) => {
          try {
            // Check if createdAt exists and is a valid string
            if (!req.createdAt || typeof req.createdAt !== "string") {
              return false;
            }

            // Try to parse the date, but handle invalid formats
            let reqDate;
            try {
              reqDate = parseISO(req.createdAt);
              // Check if the date is valid
              if (isNaN(reqDate.getTime())) {
                return false;
              }
            } catch (parseError) {
              console.warn("Invalid date format:", req.createdAt);
              return false;
            }

            return format(reqDate, "yyyy-MM-dd") === dateStr;
          } catch (e) {
            console.error("Error processing request date:", e);
            return false;
          }
        })
      : [];
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date(0)) ? null : date);
  };

  // Handle mouse hover for tooltip
  const handleMouseEnter = (date: Date, event: React.MouseEvent) => {
    const dayRequests = getRequestsByDay(date);
    if (dayRequests.length > 0) {
      setShowTooltip({
        date,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  return (
    <div className="animate-slide-up relative">
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-10 bg-white p-3 rounded-md shadow-lg border border-neutral-200 max-w-xs"
          style={{
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-sm font-medium mb-2">
            {(() => {
              try {
                return format(showTooltip.date, "MMMM d, yyyy");
              } catch (e) {
                console.error("Error formatting tooltip date:", e);
                return "Selected Date";
              }
            })()}
          </div>
          <div className="text-xs text-neutral-600">
            {Array.isArray(getRequestsByDay(showTooltip.date)) &&
            getRequestsByDay(showTooltip.date).length > 0 ? (
              getRequestsByDay(showTooltip.date).map((req, i) => (
                <div key={i} className="flex items-start mb-2">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 mt-1 ${
                      req.status === "pending"
                        ? "bg-warning-400"
                        : req.status === "approved"
                        ? "bg-success-400"
                        : req.status === "rejected"
                        ? "bg-error-400"
                        : req.status === "fulfilled"
                        ? "bg-primary-400"
                        : "bg-neutral-400"
                    }`}
                  ></span>
                  <div>
                    <div className="font-medium">{req.title}</div>
                    <div className="text-neutral-500">
                      {req.status.charAt(0).toUpperCase() +
                        req.status.slice(1).replace("_", " ")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-500 py-2">
                No requests on this day
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-primary-400" />
        Request Activity
      </h2>

      <Card3D depth="sm">
        <Card3DHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Request Activity</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-1 rounded hover:bg-neutral-100"
              onClick={goToPreviousWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-500" />
            </button>
            <span className="text-sm font-medium">{dateRangeText}</span>
            <button
              className="p-1 rounded hover:bg-neutral-100"
              onClick={goToNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </Card3DHeader>

        <Card3DContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day headers */}
            {Array.isArray(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) &&
              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, i) => (
                  <div
                    key={`header-${i}`}
                    className="py-2 text-sm font-medium text-neutral-600"
                  >
                    {day}
                  </div>
                )
              )}

            {/* Calendar cells with day numbers and status indicators */}
            {Array.isArray(weekDays) &&
              weekDays.map((date, i) => {
                const dayRequests = getRequestsByDay(date);
                const hasPending =
                  Array.isArray(dayRequests) &&
                  dayRequests.some((req) => req.status === "pending");
                const hasApproved =
                  Array.isArray(dayRequests) &&
                  dayRequests.some((req) => req.status === "approved");
                const hasDenied =
                  Array.isArray(dayRequests) &&
                  dayRequests.some((req) => req.status === "rejected");
                const hasFulfilled =
                  Array.isArray(dayRequests) &&
                  dayRequests.some((req) => req.status === "fulfilled");
                const hasOutOfStock =
                  Array.isArray(dayRequests) &&
                  dayRequests.some((req) => req.status === "out_of_stock");
                const hasRequests =
                  Array.isArray(dayRequests) && dayRequests.length > 0;

                // Safely format the date
                const isToday = (() => {
                  try {
                    return (
                      format(date, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd")
                    );
                  } catch (e) {
                    console.error("Error formatting date:", e);
                    return false;
                  }
                })();
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);

                return (
                  <div
                    key={`day-cell-${i}`}
                    className={`flex flex-col items-center py-3 rounded-md cursor-pointer transition-all
                    ${isToday ? "bg-primary-50" : "hover:bg-neutral-50"}
                    ${isSelected ? "ring-2 ring-primary-300 bg-primary-50" : ""}
                  `}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={(e) => handleMouseEnter(date, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Day number */}
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday ? "text-primary-600" : ""
                      }`}
                    >
                      {(() => {
                        try {
                          return format(date, "d");
                        } catch (e) {
                          console.error("Error formatting day:", e);
                          return "-";
                        }
                      })()}
                    </div>

                    {/* Status indicators */}
                    <div className="flex justify-center space-x-1">
                      {hasPending && (
                        <div
                          className="w-2 h-2 rounded-full bg-warning-400"
                          title="Pending"
                        ></div>
                      )}
                      {hasApproved && (
                        <div
                          className="w-2 h-2 rounded-full bg-success-400"
                          title="Approved"
                        ></div>
                      )}
                      {hasDenied && (
                        <div
                          className="w-2 h-2 rounded-full bg-error-400"
                          title="Denied"
                        ></div>
                      )}
                      {hasFulfilled && (
                        <div
                          className="w-2 h-2 rounded-full bg-primary-400"
                          title="Fulfilled"
                        ></div>
                      )}
                      {hasOutOfStock && (
                        <div
                          className="w-2 h-2 rounded-full bg-neutral-400"
                          title="Out of Stock"
                        ></div>
                      )}
                      {!hasRequests && (
                        <div className="text-[8px] text-neutral-400">
                          No data
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-primary-400" />
                {(() => {
                  try {
                    return format(selectedDate, "MMMM d, yyyy");
                  } catch (e) {
                    console.error("Error formatting selected date:", e);
                    return "Selected Date";
                  }
                })()}{" "}
                Requests
              </h4>

              {Array.isArray(getRequestsByDay(selectedDate)) &&
              getRequestsByDay(selectedDate).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {getRequestsByDay(selectedDate).map((req) => (
                    <div
                      key={req.id}
                      className="p-2 rounded-md bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-start">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${
                            req.status === "pending"
                              ? "bg-warning-400"
                              : req.status === "approved"
                              ? "bg-success-400"
                              : req.status === "rejected"
                              ? "bg-error-400"
                              : req.status === "fulfilled"
                              ? "bg-primary-400"
                              : "bg-neutral-400"
                          }`}
                        ></span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{req.title}</div>
                          <div className="text-xs text-neutral-500 flex justify-between">
                            <span>
                              {req.status.charAt(0).toUpperCase() +
                                req.status.slice(1).replace("_", " ")}
                            </span>
                            <span>Qty: {req.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500 text-sm">
                  No requests on this day
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-warning-400 mr-1"></div>
              <span className="text-xs text-neutral-600">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-success-400 mr-1"></div>
              <span className="text-xs text-neutral-600">Approved</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-error-400 mr-1"></div>
              <span className="text-xs text-neutral-600">Denied</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-primary-400 mr-1"></div>
              <span className="text-xs text-neutral-600">Fulfilled</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-neutral-400 mr-1"></div>
              <span className="text-xs text-neutral-600">Out of Stock</span>
            </div>
          </div>
        </Card3DContent>
      </Card3D>
    </div>
  );
};
