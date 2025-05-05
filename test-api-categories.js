import fetch from "node-fetch";

async function testApiCategories() {
  console.log("Testing API endpoint for fetching categories");
  
  try {
    const response = await fetch("http://localhost:3001/db/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getAll",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const categories = await response.json();
    
    console.log(`Received ${categories.length} categories from API:`);
    categories.forEach(category => {
      console.log(`- ${category.name} (${category.id}): ${category.description}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

testApiCategories();
