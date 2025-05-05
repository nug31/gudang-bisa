import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import supabase from "../db/supabase";
// Keep mockData import for fallback
import { users, currentUser as mockCurrentUser } from "../data/mockData";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "manager" | "user",
    department?: string
  ) => Promise<void>;
  updateProfile: (
    userId: string,
    data: {
      name: string;
      email: string;
      department?: string;
      avatarUrl?: string;
    }
  ) => Promise<void>;
  logout: () => void;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the user from Supabase session on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for existing Supabase session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting Supabase session:", sessionError);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log("Found existing Supabase session:", session);

          // Get the user profile from the users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user profile:", userError);
            setIsLoading(false);
            return;
          }

          if (userData) {
            console.log("User profile retrieved:", userData);
            setUser(userData);

            // Store in localStorage for backup
            localStorage.setItem("user", JSON.stringify(userData));

            // Initialize data for returning users
            await initializeUserData();
          }
        } else {
          // Fallback to localStorage if no session
          const storedUser = localStorage.getItem("user");

          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);

              // Initialize data for returning users
              await initializeUserData();
            } catch (err) {
              console.error("Error parsing stored user:", err);
              localStorage.removeItem("user");
            }
          }
        }
      } catch (error) {
        console.error("Error in loadUser:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const initializeUserData = async () => {
    console.log("Initializing user data from Supabase...");
    try {
      // Initialize inventory data
      console.log("Fetching inventory data from Supabase...");
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_items")
        .select("*");

      if (inventoryError) {
        console.error(
          "Error fetching inventory data from Supabase:",
          inventoryError
        );
      } else {
        console.log(
          `Fetched ${inventoryData?.length || 0} inventory items from Supabase`
        );
      }

      // Initialize categories
      console.log("Fetching categories data from Supabase...");
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*");

      if (categoriesError) {
        console.error(
          "Error fetching categories data from Supabase:",
          categoriesError
        );
      } else {
        console.log(
          `Fetched ${categoriesData?.length || 0} categories from Supabase`
        );
      }

      console.log("User data initialized successfully from Supabase");
    } catch (error) {
      console.error("Error initializing user data from Supabase:", error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to login with Supabase:", {
        email,
        password: "********",
      });

      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        throw new Error(error.message || "Login failed");
      }

      if (!data || !data.user) {
        throw new Error("No user data returned from Supabase");
      }

      console.log("Supabase login successful, session:", data.session);

      // Get the user's profile from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user profile:", userError);
        throw new Error("Failed to fetch user profile");
      }

      if (!userData) {
        console.error("No user profile found for ID:", data.user.id);
        throw new Error("User profile not found");
      }

      console.log("User profile retrieved:", userData);

      // Set the user in state
      setUser(userData);

      // Store user in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(userData));

      // Initialize data for the user
      await initializeUserData();
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Network error: Could not connect to the server. Please check your connection."
        );
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "admin" | "manager" | "user",
    department?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to register with Supabase:", {
        name,
        email,
        role,
        department,
      });

      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("Supabase auth registration error:", authError);
        throw new Error(authError.message || "Registration failed");
      }

      if (!authData || !authData.user) {
        throw new Error("No user data returned from Supabase");
      }

      console.log("Supabase auth registration successful:", authData);

      // Now, create the user profile in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            name,
            email,
            role,
            department,
            created_at: new Date().toISOString(),
          },
        ]);

      if (userError) {
        console.error("Error creating user profile:", userError);
        // If we fail to create the profile, we should clean up the auth user
        // This is a best effort and might fail
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up auth user after profile creation failure:",
            cleanupError
          );
        }
        throw new Error("Failed to create user profile");
      }

      console.log("User profile created successfully");

      // Registration successful, but we'll let the user log in manually
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Network error: Could not connect to the server. Please check your connection."
        );
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      throw err; // Re-throw to allow the component to handle it
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    userId: string,
    data: {
      name: string;
      email: string;
      department?: string;
      avatarUrl?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Updating profile with Supabase:", { userId, ...data });

      // Update the user profile in the users table
      const { data: updatedData, error } = await supabase
        .from("users")
        .update({
          name: data.name,
          email: data.email,
          department: data.department,
          avatar_url: data.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        throw new Error("Failed to update profile");
      }

      if (!updatedData) {
        throw new Error("No updated user data returned");
      }

      console.log("Profile updated successfully:", updatedData);

      // Update the user in state and localStorage
      setUser(updatedData);
      localStorage.setItem("user", JSON.stringify(updatedData));

      // If the email was changed, update it in Supabase Auth as well
      if (user && user.email !== data.email) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (authUpdateError) {
          console.error("Error updating auth email:", authUpdateError);
          // This is not a critical error, so we don't throw
        }
      }

      return updatedData;
    } catch (err) {
      console.error("Profile update error:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Network error: Could not connect to the server. Please check your connection."
        );
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase:", error);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Always clear local state regardless of Supabase success
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
