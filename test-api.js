import fetch from "node-fetch";

async function testApi() {
  try {
    // Test database connection
    console.log("Testing database connection...");
    const connectionResponse = await fetch(
      "http://localhost:3001/api/test-connection"
    );
    const connectionData = await connectionResponse.json();
    console.log("Connection response:", connectionData);

    // Test hybrid login (which should create a user if it doesn't exist)
    console.log("\nTesting hybrid login...");
    const hybridLoginResponse = await fetch(
      "http://localhost:3001/api/hybrid-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "password",
        }),
      }
    );

    if (hybridLoginResponse.ok) {
      const hybridLoginData = await hybridLoginResponse.json();
      console.log("Hybrid login response:", hybridLoginData);
      console.log("Using mock database:", hybridLoginData.usingMock);
    } else {
      console.log(
        "Hybrid login failed with status:",
        hybridLoginResponse.status
      );
      console.log(
        "Hybrid login endpoint might not exist, trying regular login..."
      );
    }

    // Test getting users
    console.log("\nTesting users API...");
    const usersResponse = await fetch("http://localhost:3001/db/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "getAll" }),
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`Found ${usersData.length} users:`);
      usersData.forEach((user) => {
        console.log(
          `- ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    } else {
      console.log("Failed to get users with status:", usersResponse.status);
      console.log("Response text:", await usersResponse.text());
    }

    // Test getting requests
    console.log("\nTesting requests API...");
    const requestsResponse = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "getAll" }),
    });

    if (requestsResponse.ok) {
      const requestsData = await requestsResponse.json();
      console.log(`Found ${requestsData.length} requests:`);
      requestsData.forEach((request) => {
        console.log(`- ${request.id}: ${request.title} (${request.status})`);
      });
    } else {
      console.log(
        "Failed to get requests with status:",
        requestsResponse.status
      );
      console.log("Response text:", await requestsResponse.text());
    }

    // Test login with admin account
    console.log("\nTesting login with admin account...");
    const loginResponse = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "password",
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log("Login response:", loginData);
    } else {
      console.log("Login failed with status:", loginResponse.status);
      console.log("Response text:", await loginResponse.text());
    }

    // Try with mock server login
    console.log("\nTrying mock server login...");
    const mockLoginResponse = await fetch(
      "http://localhost:3001/api/mock-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "password",
        }),
      }
    );

    if (mockLoginResponse.ok) {
      const mockLoginData = await mockLoginResponse.json();
      console.log("Mock login response:", mockLoginData);
    } else {
      console.log("Mock login failed with status:", mockLoginResponse.status);
      console.log("Mock login endpoint might not exist");
    }
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testApi();
