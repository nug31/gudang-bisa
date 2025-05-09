import fetch from "node-fetch";

async function testApi() {
  try {
    console.log("Testing Neon PostgreSQL API endpoints...");

    // Test the /db/inventory endpoint
    console.log("\nTesting /db/inventory endpoint...");
    const inventoryResponse = await fetch(
      "http://localhost:3003/db/inventory",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      }
    );

    if (inventoryResponse.ok) {
      const inventoryData = await inventoryResponse.json();
      console.log(
        `Successfully retrieved ${inventoryData.length} items from /db/inventory endpoint`
      );

      if (inventoryData.length > 0) {
        console.log("First 5 items:");
        inventoryData.slice(0, 5).forEach((item, index) => {
          console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
        });
      }
    } else {
      console.error(
        `Error: ${inventoryResponse.status} ${inventoryResponse.statusText}`
      );
      console.log("Response text:", await inventoryResponse.text());
    }

    // Test the /db/categories endpoint
    console.log("\nTesting /db/categories endpoint...");
    const categoriesResponse = await fetch(
      "http://localhost:3003/db/categories",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      }
    );

    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(
        `Successfully retrieved ${categoriesData.length} categories from /db/categories endpoint`
      );

      if (categoriesData.length > 0) {
        console.log("Categories:");
        categoriesData.forEach((category, index) => {
          console.log(
            `Category ${index + 1}: ${category.name} (ID: ${category.id})`
          );
        });
      }
    } else {
      console.error(
        `Error: ${categoriesResponse.status} ${categoriesResponse.statusText}`
      );
      console.log("Response text:", await categoriesResponse.text());
    }

    // Test the /db/users endpoint
    console.log("\nTesting /db/users endpoint...");
    const usersResponse = await fetch("http://localhost:3003/db/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getAll",
      }),
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(
        `Successfully retrieved ${usersData.length} users from /db/users endpoint`
      );

      if (usersData.length > 0) {
        console.log("Users:");
        usersData.forEach((user, index) => {
          console.log(
            `User ${index + 1}: ${user.name} (${user.email}) - Role: ${
              user.role
            }`
          );
        });
      }
    } else {
      console.error(
        `Error: ${usersResponse.status} ${usersResponse.statusText}`
      );
      console.log("Response text:", await usersResponse.text());
    }
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testApi();
