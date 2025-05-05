import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const Register: React.FC = () => {
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    // Validate form fields
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }

    if (!password.trim()) {
      setFormError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      // Always register as a regular user
      await register(name, email, password, "user", department);

      // After successful registration, redirect to login page with success message
      navigate("/login", {
        state: {
          registrationSuccess: true,
          email: email,
        },
      });
    } catch (err) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-primary-600">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-700">
          Sign up to start managing your inventory
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
        <div
          className="bg-white py-6 px-4 shadow-md sm:shadow-3d-lg rounded-lg sm:py-8 sm:px-6 md:px-10 border border-secondary-100 animate-pop"
          style={
            { "--rotateX": "0deg", "--rotateY": "0deg" } as React.CSSProperties
          }
        >
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              error={formError && !name.trim() ? formError : ""}
              required
            />

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
              autoComplete="new-password"
              error={formError && !password.trim() ? formError : ""}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={formError === "Passwords do not match" ? formError : ""}
              required
            />

            <Input
              label="Department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              autoComplete="organization"
              helperText="Optional: Your department or team"
            />

            <div>
              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 transition-all duration-100 text-sm sm:text-base py-2 sm:py-2.5"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />}
              >
                Register
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
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-100 flex items-center"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
