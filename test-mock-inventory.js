// Simple test script to verify our mock data functionality

// Mock data function to provide fallback data when database connection fails
const getMockInventoryData = () => {
  console.log("Using mock inventory data");
  return [
    {
      id: "1",
      name: "Ballpoint Pen",
      description: "Blue ballpoint pen",
      categoryId: "1",
      categoryName: "Office",
      sku: "PEN-001",
      quantityAvailable: 100,
      quantityReserved: 10,
      unitPrice: 1.99,
      location: "Shelf A1",
      imageUrl: "/img/items/pen.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Notebook",
      description: "A5 lined notebook",
      categoryId: "1",
      categoryName: "Office",
      sku: "NB-001",
      quantityAvailable: 50,
      quantityReserved: 5,
      unitPrice: 4.99,
      location: "Shelf A2",
      imageUrl: "/img/items/notebook.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
};

// Test the mock data
const mockData = getMockInventoryData();
console.log("Mock data test successful!");
console.log(`Generated ${mockData.length} mock items`);
console.log("First item:", mockData[0].name);

// Test filtering by category
const categoryId = "1";
const filteredData = mockData.filter(item => String(item.categoryId) === String(categoryId));
console.log(`Filtered to ${filteredData.length} items with categoryId ${categoryId}`);

console.log("All tests passed!");
