import React, { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const ItemRequestsTest: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching item requests data...");
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/item-requests-direct?t=${timestamp}`);

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Item requests data:", result);
      setData(result);
    } catch (err) {
      console.error("Error fetching item requests:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <PageHeader
          icon={<Database className="h-6 w-6" />}
          title="Item Requests Test"
          description="Direct test of the item_requests table in the database"
        />

        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Item Requests Table</h2>
            <Button
              onClick={fetchData}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {loading && !data ? (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin h-5 w-5 border-2 border-current rounded-full border-t-transparent"></div>
              <span>Loading item requests data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Error: {error}</span>
              </div>
            </div>
          ) : data ? (
            <div>
              <div
                className={`flex items-center mb-4 ${
                  data.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.success ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">{data.message}</span>
              </div>

              {data.tableExists ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Request Counts */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-3">
                        Request Counts
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">Total Requests:</span>
                          <span className="text-lg">{data.totalCount}</span>
                        </div>

                        {data.statusCounts &&
                          data.statusCounts.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span className="capitalize">
                                {item.status || "Unknown"}:
                              </span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recent Requests */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-3">
                        Recent Requests
                      </h3>
                      {data.recentRequests && data.recentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {data.recentRequests.map(
                            (request: any, index: number) => (
                              <div
                                key={index}
                                className="border-b pb-2 last:border-0"
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {request.title || "Untitled"}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID:{" "}
                                  {typeof request.id === "string"
                                    ? request.id.substring(0, 8) + "..."
                                    : request.id}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Created:{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleString()}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          No recent requests found
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw Data */}
                  <div className="mt-6">
                    <details className="bg-gray-50 rounded-lg p-4">
                      <summary className="font-medium text-gray-700 cursor-pointer">
                        Raw Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>
                      The item_requests table does not exist in the database.
                    </span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                Test performed at: {new Date().toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-yellow-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              No data available
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ItemRequestsTest;
