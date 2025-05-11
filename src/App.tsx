import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequestProvider } from "./context/RequestContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CategoryProvider } from "./context/CategoryContext";
import { InventoryProvider } from "./context/InventoryContext";
import { UserProvider } from "./context/UserContext";

import { Dashboard } from "./pages/Dashboard";
import { RequestList } from "./pages/RequestList";
import { RequestDetails } from "./pages/RequestDetails";
import { NewRequest } from "./pages/NewRequest";
import { Admin } from "./pages/Admin";
import { Manager } from "./pages/Manager";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { BrowseItems } from "./pages/BrowseItems";
import { Inventory } from "./pages/Inventory";
import { Profile } from "./pages/Profile";
import { LowStockItems } from "./pages/LowStockItems";
import { CategoryView } from "./pages/CategoryView";
import DatabaseTest from "./pages/DatabaseTest";
import TestRequestPage from "./pages/TestRequestPage";
import ItemRequestsTest from "./pages/ItemRequestsTest";

// PrivateRoute component to protect routes
const PrivateRoute = ({
  children,
}: {
  children: React.ReactNode | ((props: { user: any }) => React.ReactNode);
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If children is a function, call it with the user
  if (typeof children === "function") {
    return <>{children({ user })}</>;
  }

  // Otherwise, just render the children
  return <>{children}</>;
};

// AdminRoute component to protect admin routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }

  // Only admin role can access admin routes
  return user?.role === "admin" ? <>{children}</> : <Navigate to="/" />;
};

// ManagerRoute component to protect manager routes
const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }

  // Debug the user role
  console.log("Current user in ManagerRoute:", user);
  console.log("User role in ManagerRoute:", user?.role);

  // More robust role check - case insensitive and allow admin or manager
  const userRole = user?.role?.toLowerCase() || "";
  const hasAccess = userRole === "admin" || userRole === "manager";

  console.log("Access granted to manager route:", hasAccess);

  // Allow both admin and manager roles to access manager routes
  return user && hasAccess ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <NotificationProvider>
            <RequestProvider>
              <CategoryProvider>
                <InventoryProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                      path="/"
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/requests"
                      element={
                        <PrivateRoute>
                          <RequestList />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/requests/new"
                      element={
                        <PrivateRoute>
                          <NewRequest />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/requests/:id"
                      element={
                        <PrivateRoute>
                          <RequestDetails />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/browse"
                      element={
                        <PrivateRoute>
                          <BrowseItems />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <Admin />
                        </AdminRoute>
                      }
                    />

                    <Route
                      path="/manager"
                      element={
                        <ManagerRoute>
                          <Manager />
                        </ManagerRoute>
                      }
                    />

                    <Route
                      path="/inventory"
                      element={
                        <PrivateRoute>
                          {({ user }) => {
                            // Allow both admin and manager to access inventory management
                            const userRole = user?.role?.toLowerCase() || "";
                            const hasAccess =
                              userRole === "admin" || userRole === "manager";

                            return hasAccess ? (
                              <Inventory />
                            ) : (
                              <Navigate to="/" />
                            );
                          }}
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/inventory/low-stock"
                      element={
                        <PrivateRoute>
                          {({ user }) => {
                            // Allow both admin and manager to access inventory management
                            const userRole = user?.role?.toLowerCase() || "";
                            const hasAccess =
                              userRole === "admin" || userRole === "manager";

                            return hasAccess ? (
                              <LowStockItems />
                            ) : (
                              <Navigate to="/" />
                            );
                          }}
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/inventory/category/:id"
                      element={
                        <PrivateRoute>
                          {({ user }) => {
                            // Allow both admin and manager to access inventory management
                            const userRole = user?.role?.toLowerCase() || "";
                            const hasAccess =
                              userRole === "admin" || userRole === "manager";

                            return hasAccess ? (
                              <CategoryView />
                            ) : (
                              <Navigate to="/" />
                            );
                          }}
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/database-test"
                      element={
                        <PrivateRoute>
                          {({ user }) => {
                            // Only allow admin and manager to access database test
                            const userRole = user?.role?.toLowerCase() || "";
                            const hasAccess =
                              userRole === "admin" || userRole === "manager";

                            return hasAccess ? (
                              <DatabaseTest />
                            ) : (
                              <Navigate to="/" />
                            );
                          }}
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/test-request"
                      element={
                        <PrivateRoute>
                          <TestRequestPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/item-requests-test"
                      element={
                        <PrivateRoute>
                          {({ user }) => {
                            // Only allow admin and manager to access this test
                            const userRole = user?.role?.toLowerCase() || "";
                            const hasAccess =
                              userRole === "admin" || userRole === "manager";

                            return hasAccess ? (
                              <ItemRequestsTest />
                            ) : (
                              <Navigate to="/" />
                            );
                          }}
                        </PrivateRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </InventoryProvider>
              </CategoryProvider>
            </RequestProvider>
          </NotificationProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
