import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) {
    return null; // Will redirect via AuthContext
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">Your Profile</h1>
        </div>

        <Card className="animate-slide-up shadow-3d-lg">
          <CardHeader className="bg-gradient-to-r from-white to-secondary-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-500" />
                Profile Information
              </div>
              <div className="flex items-center text-sm text-neutral-500">
                <Lock className="h-4 w-4 mr-1" />
                Profile editing is currently disabled
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.name}
                  size="xl"
                  className="shadow-3d-md mb-4"
                />
                <p className="text-sm text-neutral-500 text-center mt-2">
                  Role:{" "}
                  <span className="font-semibold capitalize">{user?.role}</span>
                </p>
                <p className="text-xs text-neutral-400 text-center mt-1">
                  User ID: {user?.id}
                </p>
              </div>

              <div className="w-full md:w-2/3">
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700 text-sm">
                    Profile editing is currently disabled. Please contact your
                    administrator if you need to update your profile
                    information.
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                      {user?.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email Address
                    </label>
                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                      {user?.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Department
                    </label>
                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
                      {user?.department || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
