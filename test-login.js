import fetch from "node-fetch";

// Function to register a new user
async function registerUser() {
  const timestamp = new Date().getTime();
  const userData = {
    name: "Test User " + timestamp,
    email: `testuser${timestamp}@example.com`,
    password: "password123",
    role: "user",
    department: "Testing",
  };

  console.log("Registering new user:", userData);

  try {
    const response = await fetch("http://localhost:3001/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    console.log("Registration response:", data);
    return userData;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Function to login with user credentials
async function loginUser(email, password) {
  const loginData = {
    email,
    password,
  };

  console.log("Attempting login with:", loginData);

  try {
    const response = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      console.error("Login failed with status:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Login failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Login response:", data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Test login with existing admin account
async function testExistingLogin() {
  try {
    console.log("\n=== Testing login with existing admin account ===");
    await loginUser("admin@example.com", "password");
  } catch (error) {
    console.error("Admin login test failed:", error);
  }
}

// Main function to test registration and login
async function testRegistrationAndLogin() {
  try {
    console.log("\n=== Testing registration and login with new user ===");
    // Register a new user
    const userData = await registerUser();

    // Wait a moment to ensure registration is complete
    console.log("Waiting 2 seconds before attempting login...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to login with the new user
    await loginUser(userData.email, userData.password);
  } catch (error) {
    console.error("Registration and login test failed:", error);
  }
}

// Run the tests
async function runAllTests() {
  await testExistingLogin();
  await testRegistrationAndLogin();
}

runAllTests();
