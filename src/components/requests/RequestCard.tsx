import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar, Edit, User } from "lucide-react";
import { ItemRequest, User as UserType } from "../../types";
import { Card, CardContent, CardFooter } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { PriorityBadge } from "../ui/PriorityBadge";
import { categories } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../services/api";

interface RequestCardProps {
  request: ItemRequest;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const { user } = useAuth();
  const [requester, setRequester] = useState<UserType | undefined>(undefined);
  const category = categories.find((c) => c.id === request.category);
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";
  const isPending = request.status === "pending";

  useEffect(() => {
    // Fetch the user who made the request from the API
    const fetchRequester = async () => {
      if (request.userId) {
        try {
          const userData = await userApi.getById(request.userId);
          if (userData) {
            setRequester(userData);
          }
        } catch (error) {
          console.error("Error fetching requester data:", error);
        }
      }
    };

    fetchRequester();
  }, [request.userId]);

  return (
    <Link to={`/requests/${request.id}`} className="block h-full no-underline">
      <Card className="h-full transition-all hover:translate-y-[-4px] animate-fade-in hover:animate-float cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1">
                <span className="relative z-10 hover:text-primary-500 transition-colors">
                  {request.title}
                </span>
              </h3>
              <div className="flex flex-col mt-1 space-y-1">
                <p className="text-sm text-neutral-500">{category?.name}</p>
                {requester && (
                  <div className="flex items-center text-sm text-neutral-500">
                    <User className="h-3.5 w-3.5 mr-1 text-neutral-400" />
                    <span className="font-medium">
                      Requested by {requester.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="mt-4">
            <p className="text-sm text-neutral-700 line-clamp-2">
              {request.description}
            </p>
          </div>

          <div className="mt-4 flex items-center">
            <PriorityBadge priority={request.priority} />
            <span className="mx-3 text-neutral-300">•</span>
            <div className="flex items-center text-sm text-neutral-500">
              <Calendar className="mr-1 h-4 w-4" />
              {formatDistanceToNow(new Date(request.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-neutral-50 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-neutral-700">
              Qty: {request.quantity}
            </span>
          </div>

          {isAdminOrManager && isPending && (
            <div
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              onClick={(e) => {
                // Prevent the parent link from being triggered
                e.stopPropagation();
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Manage Request
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
