import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from registration
  const registrationSuccess = location.state?.registrationSuccess;
  const registeredEmail = location.state?.email;

  const [email, setEmail] = useState(registeredEmail || "");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(
    registrationSuccess
      ? "Registration successful! Please log in with your new account."
      : null
  );

  // Clear location state after reading it
  useEffect(() => {
    if (location.state) {
      // Replace the current entry in the history stack to remove the state
      navigate(location.pathname, { replace: true });
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    console.log("Login form submitted");

    if (!email.trim()) {
      setFormError("Email is required");
      console.log("Email is required");
      return;
    }

    if (!password.trim()) {
      setFormError("Password is required");
      console.log("Password is required");
      return;
    }

    console.log("Attempting to log in with:", email);

    // First, test the API connection
    console.log("Testing API connection with Netlify function");
    try {
      const testResponse = await fetch("/.netlify/functions/hello-world");
      console.log("Test API response:", await testResponse.json());
    } catch (testErr) {
      console.error("Test API failed:", testErr);
    }

    try {
      console.log("Using AuthContext login function");

      // Use the login function from AuthContext
      await login(email, password);

      // If login is successful, navigate to the dashboard
      navigate("/");
    } catch (err) {
      console.error("Error during login:", err);
      setFormError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center parallax-container">
          <div className="relative parallax-layer-1 flex items-center justify-center hover:animate-rotate-slow group">
            <img
              src="/logosmk.png"
              alt="SMK Logo"
              className="h-16 sm:h-20 w-auto object-contain animate-float-slow group-hover:animate-none"
              style={{
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
                maxWidth: "140px",
              }}
            />
          </div>
        </div>
        <h2 className="mt-6 sm:mt-8 text-center text-2xl sm:text-3xl font-bold text-primary-600">
          Gudang Mitra
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-neutral-700">
          Sign in to manage your inventory
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
        <div
          className="bg-white py-6 px-4 shadow-md sm:shadow-3d-lg rounded-lg sm:py-8 sm:px-6 md:px-10 border border-secondary-100 animate-pop"
          style={
            { "--rotateX": "0deg", "--rotateY": "0deg" } as React.CSSProperties
          }
        >
          {successMessage && (
            <div className="mb-6 p-3 bg-success-50 border border-success-200 rounded-md text-success-700 text-sm flex items-start">
              <CheckCircle className="h-5 w-5 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={formError && !email.trim() ? formError : ""}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={formError && !password.trim() ? formError : ""}
              required
            />

            <div>
              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 transition-all duration-100 text-sm sm:text-base py-2 sm:py-2.5"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />}
              >
                Sign in
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-md text-error-700 text-sm">
                {error}
              </div>
            )}
          </form>

          <div className="mt-4 sm:mt-6 flex items-center justify-center">
            <div className="text-xs sm:text-sm">
              <span className="text-neutral-500">Don't have an account?</span>{" "}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-100"
              >
                Register now
              </Link>
            </div>
          </div>

          {/* Demo Accounts section - hidden as requested */}
        </div>
      </div>
    </div>
  );
};
