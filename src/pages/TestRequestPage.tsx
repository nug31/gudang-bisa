import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";
import { useRequests } from "../context/RequestContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import Layout from "../components/Layout";
import { requestDbApi, inventoryApi } from "../services/api";

const TestRequestPage: React.FC = () => {
  const { user } = useAuth();
  const { inventoryItems, fetchInventoryItems } = useInventory();
  const { createRequest, fetchRequests, requests } = useRequests();
  const [isLoading, setIsLoading] = useState(false);
  const [directApiLoading, setDirectApiLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [directApiResult, setDirectApiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [directApiError, setDirectApiError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  useEffect(() => {
    fetchInventoryItems();
    fetchRequests();
  }, [fetchInventoryItems, fetchRequests]);

  const handleTestRequest = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    if (!selectedItemId) {
      setError("Please select an item");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Creating test request...");

      const selectedItem = inventoryItems.find(
        (item) => item.id === selectedItemId
      );

      if (!selectedItem) {
        throw new Error("Selected item not found");
      }

      console.log("Selected item:", selectedItem);

      const requestData = {
        title: `Test Request for ${selectedItem.name}`,
        description: `This is a test request for ${selectedItem.name}`,
        priority: "medium",
        status: "pending",
        userId: user.id,
        itemId: selectedItem.id,
        inventoryItemId: selectedItem.id,
        quantity: 1,
        categoryId:
          selectedItem.categoryId || "11111111-1111-1111-1111-111111111111",
        category: selectedItem.category || "office",
      };

      console.log("Request data:", requestData);

      const response = await createRequest(requestData);
      console.log("Request created successfully:", response);

      setResult(response);
      setError(null);

      // Refresh the requests list
      fetchRequests();
    } catch (err) {
      console.error("Error creating test request:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct API test function that bypasses the context
  const handleDirectApiTest = async () => {
    if (!user) {
      setDirectApiError("User not authenticated");
      return;
    }

    if (!selectedItemId) {
      setDirectApiError("Please select an item");
      return;
    }

    setDirectApiLoading(true);
    setDirectApiError(null);
    setDirectApiResult(null);

    try {
      console.log("Creating test request using direct API...");

      const selectedItem = inventoryItems.find(
        (item) => item.id === selectedItemId
      );

      if (!selectedItem) {
        throw new Error("Selected item not found");
      }

      console.log("Selected item for direct API test:", selectedItem);

      const requestData = {
        title: `Direct API Test Request for ${selectedItem.name}`,
        description: `This is a direct API test request for ${
          selectedItem.name
        } at ${new Date().toLocaleString()}`,
        priority: "medium",
        status: "pending",
        userId: user.id,
        itemId: selectedItem.id,
        inventoryItemId: selectedItem.id,
        quantity: 1,
        reason: `Testing direct API at ${new Date().toLocaleString()}`,
      };

      console.log("Direct API request data:", requestData);

      // Use the direct API service instead of the context
      const response = await requestDbApi.create(requestData);
      console.log("Direct API request created successfully:", response);

      setDirectApiResult(response);
      setDirectApiError(null);

      // Refresh the requests list
      fetchRequests();
    } catch (err) {
      console.error("Error creating direct API test request:", err);
      setDirectApiError(
        err instanceof Error ? err.message : "Unknown error occurred"
      );
      setDirectApiResult(null);
    } finally {
      setDirectApiLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Item Request</h1>

      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Create Test Request</h2>

        {!user && (
          <div className="bg-warning-100 text-warning-800 p-4 rounded-md mb-4">
            You need to be logged in to create a request.
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select an Item
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select an item...</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.quantity || 0} available)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Button
            onClick={handleTestRequest}
            isLoading={isLoading}
            disabled={isLoading || directApiLoading || !selectedItemId || !user}
            className="flex-1"
          >
            Create Test Request (Context API)
          </Button>

          <Button
            onClick={handleDirectApiTest}
            isLoading={directApiLoading}
            disabled={isLoading || directApiLoading || !selectedItemId || !user}
            className="flex-1"
            variant="outline"
          >
            Create Test Request (Direct API)
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-error-100 text-error-800 rounded-md">
            <strong>Context API Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-success-100 text-success-800 rounded-md">
            <strong>Context API Success!</strong> Request created with ID:{" "}
            {result.id}
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {directApiError && (
          <div className="mt-4 p-4 bg-error-100 text-error-800 rounded-md">
            <strong>Direct API Error:</strong> {directApiError}
          </div>
        )}

        {directApiResult && (
          <div className="mt-4 p-4 bg-success-100 text-success-800 rounded-md">
            <strong>Direct API Success!</strong> Request created with ID:{" "}
            {directApiResult.id}
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(directApiResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Requests</h2>

        {requests.length === 0 ? (
          <p className="text-gray-500">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.slice(0, 10).map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TestRequestPage;
