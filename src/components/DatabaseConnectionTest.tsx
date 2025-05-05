import React, { useState, useEffect } from "react";

export const DatabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/test-connection");
        const data = await response.json();

        setConnectionStatus(data);
        console.log("Database connection test result:", data);
      } catch (error) {
        console.error("Error testing database connection:", error);
        setConnectionStatus({
          success: false,
          message: "Error connecting to database",
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Database Connection Status</h2>

      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span>Testing connection...</span>
        </div>
      ) : connectionStatus ? (
        <div>
          <div
            className={`flex items-center space-x-2 ${
              connectionStatus.success ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="text-lg">
              {connectionStatus.success ? "✓" : "✗"}
            </span>
            <span className="font-medium">{connectionStatus.message}</span>
          </div>

          {connectionStatus.error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {connectionStatus.error}
            </div>
          )}

          {connectionStatus.success && (
            <div className="mt-2 text-sm text-green-600">
              Successfully connected to database: oyishhkx_gudang
            </div>
          )}
        </div>
      ) : (
        <div className="text-yellow-600">
          No connection information available
        </div>
      )}
    </div>
  );
};
