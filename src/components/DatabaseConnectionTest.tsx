import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ConnectionTestResult {
  timestamp: string;
  connectionStringInfo: {
    available: boolean;
    length: number;
    firstChars: string;
    containsNeon: boolean;
    containsPostgresql: boolean;
    envVarSet: boolean;
  };
  connectionResult: {
    connected: boolean;
    error?: string;
    errorCode?: string;
    errorType?: string;
    tables?: string[];
    counts?: {
      tables: number;
      inventoryItems: number;
      categories: number;
      users: number;
      requests: number;
    };
    sampleItem?: any;
    dbVersion?: string;
  };
  poolInfo: {
    initialized: boolean;
    poolObject: string;
  };
  queryResult: {
    success: boolean;
    timestamp?: string;
    error?: string;
    code?: string;
  } | null;
  environment: {
    nodeEnv: string;
    netlifyDev: string;
    netlifyContext: string;
  };
}

export const DatabaseConnectionTest: React.FC = () => {
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    try {
      setLoading(true);

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/.netlify/functions/test-db-connection?t=${timestamp}`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setResult(data);

      // Set the connection status for backward compatibility
      setConnectionStatus({
        success: data.connectionResult.connected,
        message: data.connectionResult.connected
          ? "Successfully connected to database"
          : "Failed to connect to database",
        error: data.connectionResult.error,
      });

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

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Database Connection Status</h2>
        <Button
          onClick={testConnection}
          disabled={loading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>
      </div>

      {loading && !connectionStatus ? (
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
            {connectionStatus.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{connectionStatus.message}</span>
          </div>

          {connectionStatus.error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {connectionStatus.error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              {/* Connection String Info */}
              <div>
                <h3 className="font-medium text-sm mb-1">Connection String</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>Available:</div>
                  <div>
                    {result.connectionStringInfo.available ? "Yes" : "No"}
                  </div>

                  <div>Length:</div>
                  <div>{result.connectionStringInfo.length}</div>

                  <div>Contains 'neon':</div>
                  <div>
                    {result.connectionStringInfo.containsNeon ? "Yes" : "No"}
                  </div>

                  <div>Contains 'postgresql':</div>
                  <div>
                    {result.connectionStringInfo.containsPostgresql
                      ? "Yes"
                      : "No"}
                  </div>

                  <div>Env var set:</div>
                  <div>
                    {result.connectionStringInfo.envVarSet ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {/* Database Info */}
              {result.connectionResult.connected && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Database Info</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>Version:</div>
                    <div>
                      {result.connectionResult.dbVersion?.split(" ")[0] ||
                        "Unknown"}
                    </div>

                    <div>Tables:</div>
                    <div>{result.connectionResult.counts?.tables || 0}</div>

                    <div>Inventory Items:</div>
                    <div>
                      {result.connectionResult.counts?.inventoryItems || 0}
                    </div>

                    <div>Categories:</div>
                    <div>{result.connectionResult.counts?.categories || 0}</div>

                    <div>Users:</div>
                    <div>{result.connectionResult.counts?.users || 0}</div>

                    <div>Item Requests:</div>
                    <div
                      className={
                        result.connectionResult.counts?.requests
                          ? ""
                          : "text-yellow-600 font-medium"
                      }
                    >
                      {result.connectionResult.counts?.requests || "Not found"}
                      {!result.connectionResult.counts?.requests && (
                        <span className="block text-xs text-yellow-600 mt-1">
                          Check the Item Requests section below for details
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Query Test */}
              {result.queryResult && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Query Test</h3>
                  <div
                    className={
                      result.queryResult.success
                        ? "text-green-600 text-xs"
                        : "text-red-600 text-xs"
                    }
                  >
                    {result.queryResult.success
                      ? `Query successful: ${result.queryResult.timestamp}`
                      : `Query failed: ${result.queryResult.error}`}
                  </div>
                </div>
              )}

              <div className="text-xs text-neutral-500 mt-2">
                Test performed at: {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-yellow-600 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          No connection information available
        </div>
      )}
    </div>
  );
};
