import React, { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Calendar,
  User,
  Clock,
  Tag,
  Package,
  Check,
  X,
  Send,
} from "lucide-react";
import { ItemRequest, Comment, User as UserType } from "../../types";
import { useRequests } from "../../context/RequestContext";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/StatusBadge";
import { PriorityBadge } from "../ui/PriorityBadge";
import { categories } from "../../data/mockData";
import { userApi } from "../../services/api";

interface RequestDetailProps {
  request: ItemRequest;
  onEdit?: () => void;
}

export const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onEdit,
}) => {
  const { user } = useAuth();
  const { updateRequest, addComment } = useRequests();
  const [newComment, setNewComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestUser, setRequestUser] = useState<UserType | null>(null);
  const [approver, setApprover] = useState<UserType | null>(null);
  const [rejecter, setRejecter] = useState<UserType | null>(null);
  const [commentUsers, setCommentUsers] = useState<Record<string, UserType>>(
    {}
  );

  const category = categories.find((c) => c.id === request.category);

  // Fetch user data
  useEffect(() => {
    const fetchUsers = async () => {
      // Fetch requester
      if (request.userId) {
        const userData = await userApi.getById(request.userId);
        if (userData) setRequestUser(userData);
      }

      // Fetch approver if exists
      if (request.approvedBy) {
        const approverData = await userApi.getById(request.approvedBy);
        if (approverData) setApprover(approverData);
      }

      // Fetch rejecter if exists
      if (request.rejectedBy) {
        const rejecterData = await userApi.getById(request.rejectedBy);
        if (rejecterData) setRejecter(rejecterData);
      }

      // Fetch comment users
      if (request.comments && request.comments.length > 0) {
        const userIds = [...new Set(request.comments.map((c) => c.userId))];
        const users: Record<string, UserType> = {};

        for (const userId of userIds) {
          const userData = await userApi.getById(userId);
          if (userData) users[userId] = userData;
        }

        setCommentUsers(users);
      }
    };

    fetchUsers();
  }, [request]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(request.id, newComment);
      setNewComment("");
    }
  };

  const handleApprove = async () => {
    // More robust role check with case insensitive comparison
    const userRole = user?.role?.toLowerCase() || '';
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    console.log("Approving request - User:", user);
    console.log("User role:", userRole, "Has permission:", isAdminOrManager);
    
    if (!user || !isAdminOrManager) {
      console.error("Permission denied: User is not admin or manager");
      return;
    }

    console.log("Approving request:", request.id);

    const updatedRequest = {
      ...request,
      status: "approved" as "draft" | "pending" | "approved" | "rejected" | "fulfilled",
      approvedAt: new Date().toISOString(),
      approvedBy: user.id,
    };

    console.log("Updated request data:", updatedRequest);

    try {
      const result = await updateRequest(updatedRequest);
      console.log("Update result:", result);

      // Force a refresh of the page to show the updated status
      window.location.reload();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async () => {
    // More robust role check with case insensitive comparison
    const userRole = user?.role?.toLowerCase() || '';
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    console.log("Rejecting request - User:", user);
    console.log("User role:", userRole, "Has permission:", isAdminOrManager);
    
    if (!user || !isAdminOrManager || !rejectionReason.trim()) {
      console.error("Permission denied or missing rejection reason");
      return;
    }

    console.log("Rejecting request:", request.id);

    const updatedRequest = {
      ...request,
      status: "rejected" as "draft" | "pending" | "approved" | "rejected" | "fulfilled",
      rejectedAt: new Date().toISOString(),
      rejectedBy: user.id,
      rejectionReason: rejectionReason,
    };

    console.log("Updated request data:", updatedRequest);

    try {
      const result = await updateRequest(updatedRequest);
      console.log("Update result:", result);

      setShowRejectForm(false);
      setRejectionReason("");

      // Force a refresh of the page to show the updated status
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const handleFulfill = async () => {
    // More robust role check with case insensitive comparison
    const userRole = user?.role?.toLowerCase() || '';
    const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
    
    console.log("Fulfilling request - User:", user);
    console.log("User role:", userRole, "Has permission:", isAdminOrManager);
    
    if (!user || !isAdminOrManager) {
      console.error("Permission denied: User is not admin or manager");
      return;
    }

    console.log("Fulfilling request:", request.id);

    const updatedRequest = {
      ...request,
      status: "fulfilled" as "draft" | "pending" | "approved" | "rejected" | "fulfilled",
      fulfillmentDate: new Date().toISOString(),
    };

    console.log("Updated request data:", updatedRequest);

    try {
      const result = await updateRequest(updatedRequest);
      console.log("Update result:", result);

      // Force a refresh of the page to show the updated status
      window.location.reload();
    } catch (error) {
      console.error("Error fulfilling request:", error);
      alert("Failed to fulfill request. Please try again.");
    }
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const canEdit =
    user?.id === request.userId &&
    ["draft", "pending"].includes(request.status);
  // More robust role checks with case insensitive comparison
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isAdminOrManager = isAdmin || isManager;
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{request.title}</CardTitle>
            <p className="text-neutral-500 mt-1">
              Submitted by {requestUser?.name} •{" "}
              {request.createdAt
                ? formatDistanceToNow(new Date(request.createdAt), {
                    addSuffix: true,
                  })
                : "recently"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={request.status} className="text-sm" />
            <PriorityBadge priority={request.priority} className="text-sm" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-neutral-700">{request.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Request Details</h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-700">
                    <span className="font-medium mr-2">Category:</span>
                    {category?.name}
                  </span>
                </div>

                <div className="flex items-center">
                  <Package className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-700">
                    <span className="font-medium mr-2">Quantity:</span>
                    {request.quantity}
                  </span>
                </div>

                {request.fulfillmentDate && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-neutral-500 mr-2" />
                    <span className="text-sm text-neutral-700">
                      <span className="font-medium mr-2">Needed By:</span>
                      {request.fulfillmentDate
                        ? format(new Date(request.fulfillmentDate), "PPP")
                        : "Unknown date"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status Information</h3>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-700">
                    <span className="font-medium mr-2">Created:</span>
                    {request.createdAt
                      ? format(new Date(request.createdAt), "PPP")
                      : "Unknown date"}
                  </span>
                </div>

                <div className="flex items-center">
                  <User className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-700">
                    <span className="font-medium mr-2">Requested By:</span>
                    {requestUser?.name}
                  </span>
                </div>

                {request.approvedAt && approver && (
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-success-600 mr-2" />
                    <span className="text-sm text-neutral-700">
                      <span className="font-medium mr-2">Approved By:</span>
                      {approver.name} on{" "}
                      {request.approvedAt
                        ? format(new Date(request.approvedAt), "PPP")
                        : "Unknown date"}
                    </span>
                  </div>
                )}

                {request.rejectedAt && rejecter && (
                  <div className="flex items-start">
                    <X className="h-5 w-5 text-error-500 mr-2 mt-0.5" />
                    <div>
                      <span className="text-sm text-neutral-700">
                        <span className="font-medium mr-2">Rejected By:</span>
                        {rejecter.name} on{" "}
                        {request.rejectedAt
                          ? format(new Date(request.rejectedAt), "PPP")
                          : "Unknown date"}
                      </span>
                      {request.rejectionReason && (
                        <p className="text-sm text-neutral-600 mt-1">
                          <span className="font-medium">Reason: </span>
                          {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin/Manager Actions */}
          {isAdminOrManager && isPending && (
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">
                {isAdmin ? "Admin" : "Manager"} Actions
              </h3>

              {!showRejectForm ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleApprove}
                    leftIcon={<Check className="h-4 w-4" />}
                    variant="success"
                  >
                    Approve Request
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    leftIcon={<X className="h-4 w-4" />}
                    variant="danger"
                  >
                    Reject Request
                  </Button>
                </div>
              ) : (
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <h4 className="text-base font-medium mb-2">
                    Rejection Reason
                  </h4>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection"
                    className="mb-3"
                  />
                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={handleCancelReject}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="danger"
                      size="sm"
                      disabled={!rejectionReason.trim()}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdminOrManager && isApproved && (
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">
                {isAdmin ? "Admin" : "Manager"} Actions
              </h3>
              <Button
                onClick={handleFulfill}
                leftIcon={<Check className="h-4 w-4" />}
                variant="primary"
              >
                Mark as Fulfilled
              </Button>
            </div>
          )}

          {/* User Actions */}
          {canEdit && (
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <div className="flex justify-end">
                <Button onClick={onEdit} variant="secondary">
                  Edit Request
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Comments</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {request.comments && request.comments.length > 0 ? (
              request.comments.map((comment) => {
                const commentUser = commentUsers[comment.userId];
                return (
                  <div
                    key={comment.id}
                    className="flex space-x-3 pb-4 border-b border-neutral-100 last:border-0"
                  >
                    <Avatar
                      src={commentUser?.avatarUrl}
                      name={commentUser?.name || ""}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-neutral-900">
                          {commentUser?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">
                          {comment.createdAt
                            ? formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                              })
                            : "recently"}
                        </span>
                      </div>
                      <p className="text-neutral-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-neutral-500 italic">No comments yet.</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <form onSubmit={handleSubmitComment} className="w-full">
            <div className="flex space-x-3">
              <Avatar src={user?.avatarUrl} name={user?.name || ""} size="sm" />
              <div className="flex-grow relative">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-500 hover:text-primary-600 focus:outline-none"
                  disabled={!newComment.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};
