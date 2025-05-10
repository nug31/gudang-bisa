import React from "react";
import { DatabaseConnectionTest } from "../components/DatabaseConnectionTest";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DatabaseTest: React.FC = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          title="Database Connection Test"
          description="Test the connection to the Neon PostgreSQL database"
        />

        <div className="mt-6">
          <DatabaseConnectionTest />
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Troubleshooting Tips
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
            <li>
              Make sure the Neon database connection string is correctly set in
              your Netlify environment variables.
            </li>
            <li>
              Check that the database server is running and accessible from your
              deployment environment.
            </li>
            <li>
              Verify that the database tables (inventory_items, categories,
              users, etc.) exist in the database.
            </li>
            <li>
              If you're seeing "Connection timeout" errors, the database server
              might be overloaded or unreachable.
            </li>
            <li>
              If authentication errors occur, double-check the username and
              password in the connection string.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DatabaseTest;
