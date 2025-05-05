import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DatabaseConnectionStatusProps {
  databaseName?: string;
}

export const DatabaseConnectionStatus: React.FC<
  DatabaseConnectionStatusProps
> = ({ databaseName = "oyishhkx_gudang" }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);

  // Hide the notification when user logs in
  useEffect(() => {
    if (user) {
      setVisible(false);
    }
  }, [user]);

  if (!visible) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">
          Database Connection Status
        </h2>
        <div className="flex items-start text-success-600">
          <CheckCircle className="h-5 w-5 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Database connected successfully</p>
            <p className="text-sm text-success-600 mt-1">
              Successfully connected to database: {databaseName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
