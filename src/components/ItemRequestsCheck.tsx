import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
} from "lucide-react";

export const ItemRequestsCheck: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkItemRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Starting item requests check...");

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/.netlify/functions/check-item-requests?t=${timestamp}`;
      console.log("Fetching from URL:", url);

      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        clearTimeout(timeoutId);

        console.log("Response received:", response.status, response.statusText);

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Item requests check result:", data);
        setResult(data);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          console.error("Request timed out after 15 seconds");
          setError("Request timed out. The server took too long to respond.");
        } else {
          console.error("Fetch error:", fetchError);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)
          );
        }
      }
    } catch (error) {
      console.error("Error in checkItemRequests function:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkItemRequests();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          Item Requests Table Check
        </h2>
        <Button
          onClick={checkItemRequests}
          disabled={loading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Check Again
            </>
          )}
        </Button>
      </div>

      {loading && !result ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span>Checking item_requests table...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      ) : result ? (
        <div>
          <div
            className={`flex items-center space-x-2 ${
              result.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{result.message}</span>
          </div>

          {result.data && (
            <div className="mt-4 space-y-4">
              {/* Table Structure */}
              {result.data.tableExists && (
                <>
                  <div>
                    <h3 className="font-medium text-sm mb-1">
                      Table Structure
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                              Column
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">
                              Nullable
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.data.tableStructure.map(
                            (column: any, index: number) => (
                              <tr key={index}>
                                <td className="px-3 py-2">
                                  {column.column_name}
                                </td>
                                <td className="px-3 py-2">
                                  {column.data_type}
                                </td>
                                <td className="px-3 py-2">
                                  {column.is_nullable === "YES" ? "Yes" : "No"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Status Counts */}
                  <div>
                    <h3 className="font-medium text-sm mb-1">
                      Request Status Counts
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>Total Requests:</div>
                      <div>{result.data.totalRequests}</div>

                      {result.data.statusCounts.map(
                        (status: any, index: number) => (
                          <React.Fragment key={index}>
                            <div className="capitalize">
                              {status.status || "Unknown"}:
                            </div>
                            <div>{status.count}</div>
                          </React.Fragment>
                        )
                      )}
                    </div>
                  </div>

                  {/* Sample Requests */}
                  {result.data.sampleRequests.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-1">
                        Sample Requests
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">
                                ID
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">
                                Title
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">
                                Status
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {result.data.sampleRequests.map(
                              (request: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-3 py-2">
                                    {request.id.substring(0, 8)}...
                                  </td>
                                  <td className="px-3 py-2">{request.title}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        request.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : request.status === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : request.status === "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {request.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {new Date(
                                      request.created_at
                                    ).toLocaleString()}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="text-xs text-neutral-500 mt-2">
            Test performed at: {new Date().toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-yellow-600 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          No information available
        </div>
      )}
    </div>
  );
};
