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

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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

  // Allow both admin and manager roles to access manager routes
  return user?.role === "admin" || user?.role === "manager" ? (
    <>{children}</>
  ) : (
    <Navigate to="/" />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
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
                      <ManagerRoute>
                        <Inventory />
                      </ManagerRoute>
                    }
                  />

                  <Route
                    path="/inventory/low-stock"
                    element={
                      <ManagerRoute>
                        <LowStockItems />
                      </ManagerRoute>
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

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </InventoryProvider>
            </CategoryProvider>
          </RequestProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
