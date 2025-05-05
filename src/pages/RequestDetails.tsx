import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useRequests } from "../context/RequestContext";
import { RequestDetail } from "../components/requests/RequestDetail";
import { RequestForm } from "../components/requests/RequestForm";
import { Button } from "../components/ui/Button";
import { ItemRequest } from "../types";

export const RequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getRequestById, loading } = useRequests();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [request, setRequest] = useState<ItemRequest | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedRequest = await getRequestById(id);
        setRequest(fetchedRequest);
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [id, getRequestById]);

  useEffect(() => {
    if (!isLoading && !request) {
      // Redirect if request not found
      navigate("/requests", { replace: true });
    }
  }, [request, isLoading, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading || isLoading) {
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

  if (!request) {
    return null; // Will redirect via useEffect
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
          >
            Back
          </Button>
        </div>

        {isEditing ? (
          <RequestForm initialData={request} isEdit={true} />
        ) : (
          <RequestDetail request={request} onEdit={handleEdit} />
        )}
      </div>
    </Layout>
  );
};
