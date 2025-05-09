const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body);

    // Validate action
    if (!data.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Action is required" }),
      };
    }

    const action = data.action;

    switch (action) {
      case "getAll":
        // Get all categories
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, description")
          .order("name");

        if (categoriesError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching categories",
              error: categoriesError.message,
            }),
          };
        }

        // Get item counts for each category
        for (const category of categories) {
          const { count, error: countError } = await supabase
            .from("inventory_items")
            .select("id", { count: "exact", head: true })
            .eq("category_id", category.id);

          if (!countError) {
            category.itemCount = count;
          } else {
            category.itemCount = 0;
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories),
        };

      case "getById":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const id = data.id;

        // Get category by ID
        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .select("id, name, description")
          .eq("id", id)
          .single();

        if (categoryError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              message: "Category not found",
              error: categoryError.message,
            }),
          };
        }

        // Get item count for the category
        const { count, error: countError } = await supabase
          .from("inventory_items")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id);

        if (!countError) {
          category.itemCount = count;
        } else {
          category.itemCount = 0;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(category),
        };

      case "create":
        // Validate required fields
        if (!data.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category name is required" }),
          };
        }

        // Insert the category
        const { data: createdCategory, error: createError } = await supabase
          .from("categories")
          .insert([
            {
              name: data.name,
              description: data.description || null,
            },
          ])
          .select()
          .single();

        if (createError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating category",
              error: createError.message,
            }),
          };
        }

        // Add itemCount property
        createdCategory.itemCount = 0;

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(createdCategory),
        };

      case "update":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const updateId = data.id;

        // Build the update object
        const updateData = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined)
          updateData.description = data.description;

        // If no fields to update, return error
        if (Object.keys(updateData).length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "No fields to update" }),
          };
        }

        // Update the category
        const { data: updatedCategory, error: updateError } = await supabase
          .from("categories")
          .update(updateData)
          .eq("id", updateId)
          .select()
          .single();

        if (updateError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error updating category",
              error: updateError.message,
            }),
          };
        }

        // Get item count for the category
        const { count: updatedCount, error: updatedCountError } = await supabase
          .from("inventory_items")
          .select("id", { count: "exact", head: true })
          .eq("category_id", updateId);

        if (!updatedCountError) {
          updatedCategory.itemCount = updatedCount;
        } else {
          updatedCategory.itemCount = 0;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedCategory),
        };

      case "delete":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const deleteId = data.id;

        // Check if the category has any inventory items
        const { count: itemCount, error: itemCountError } = await supabase
          .from("inventory_items")
          .select("id", { count: "exact", head: true })
          .eq("category_id", deleteId);

        if (!itemCountError && itemCount > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Cannot delete category that has inventory items",
            }),
          };
        }

        // Check if the category has any requests
        const { count: requestCount, error: requestCountError } = await supabase
          .from("item_requests")
          .select("id", { count: "exact", head: true })
          .eq("category_id", deleteId);

        if (!requestCountError && requestCount > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Cannot delete category that has requests",
            }),
          };
        }

        // Delete the category
        const { error: deleteError } = await supabase
          .from("categories")
          .delete()
          .eq("id", deleteId);

        if (deleteError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error deleting category",
              error: deleteError.message,
            }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Category deleted successfully" }),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid action" }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
