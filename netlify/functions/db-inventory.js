const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
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
        body: JSON.stringify({ message: 'Action is required' }),
      };
    }

    const action = data.action;

    switch (action) {
      case 'getAll':
        // Get all inventory items with category information
        const { data: items, error: itemsError } = await supabase
          .from('inventory_items')
          .select(`
            id, 
            name, 
            description, 
            category_id,
            sku,
            quantity_available,
            quantity_reserved,
            unit_price,
            location,
            image_url,
            created_at,
            updated_at,
            categories(id, name)
          `)
          .order('name');

        if (itemsError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error fetching inventory items', error: itemsError.message }),
          };
        }

        // Transform the data to match the frontend model
        const transformedItems = items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          categoryId: item.category_id,
          categoryName: item.categories ? item.categories.name : 'Unknown',
          sku: item.sku,
          quantityAvailable: item.quantity_available,
          quantityReserved: item.quantity_reserved,
          unitPrice: item.unit_price,
          location: item.location,
          imageUrl: item.image_url,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(transformedItems),
        };

      case 'getById':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Item ID is required' }),
          };
        }

        const id = data.id;

        // Get item by ID with category information
        const { data: item, error: itemError } = await supabase
          .from('inventory_items')
          .select(`
            id, 
            name, 
            description, 
            category_id,
            sku,
            quantity_available,
            quantity_reserved,
            unit_price,
            location,
            image_url,
            created_at,
            updated_at,
            categories(id, name)
          `)
          .eq('id', id)
          .single();

        if (itemError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Item not found', error: itemError.message }),
          };
        }

        // Transform the data to match the frontend model
        const transformedItem = {
          id: item.id,
          name: item.name,
          description: item.description,
          categoryId: item.category_id,
          categoryName: item.categories ? item.categories.name : 'Unknown',
          sku: item.sku,
          quantityAvailable: item.quantity_available,
          quantityReserved: item.quantity_reserved,
          unitPrice: item.unit_price,
          location: item.location,
          imageUrl: item.image_url,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(transformedItem),
        };

      case 'create':
        // Validate required fields
        if (!data.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Item name is required' }),
          };
        }

        if (!data.categoryId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Category ID is required' }),
          };
        }

        // Insert the item
        const { data: createdItem, error: createError } = await supabase
          .from('inventory_items')
          .insert([
            {
              name: data.name,
              description: data.description || null,
              category_id: data.categoryId,
              sku: data.sku || null,
              quantity_available: data.quantityAvailable || 0,
              quantity_reserved: data.quantityReserved || 0,
              unit_price: data.unitPrice || null,
              location: data.location || null,
              image_url: data.imageUrl || null
            }
          ])
          .select()
          .single();

        if (createError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error creating item', error: createError.message }),
          };
        }

        // Get the category name
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('name')
          .eq('id', createdItem.category_id)
          .single();

        // Transform the data to match the frontend model
        const transformedCreatedItem = {
          id: createdItem.id,
          name: createdItem.name,
          description: createdItem.description,
          categoryId: createdItem.category_id,
          categoryName: category ? category.name : 'Unknown',
          sku: createdItem.sku,
          quantityAvailable: createdItem.quantity_available,
          quantityReserved: createdItem.quantity_reserved,
          unitPrice: createdItem.unit_price,
          location: createdItem.location,
          imageUrl: createdItem.image_url,
          createdAt: createdItem.created_at,
          updatedAt: createdItem.updated_at
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(transformedCreatedItem),
        };

      case 'update':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Item ID is required' }),
          };
        }

        const updateId = data.id;
        
        // Build the update object
        const updateData = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
        if (data.sku !== undefined) updateData.sku = data.sku;
        if (data.quantityAvailable !== undefined) updateData.quantity_available = data.quantityAvailable;
        if (data.quantityReserved !== undefined) updateData.quantity_reserved = data.quantityReserved;
        if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

        // If no fields to update, return error
        if (Object.keys(updateData).length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'No fields to update' }),
          };
        }

        // Update the item
        const { data: updatedItem, error: updateError } = await supabase
          .from('inventory_items')
          .update(updateData)
          .eq('id', updateId)
          .select()
          .single();

        if (updateError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error updating item', error: updateError.message }),
          };
        }

        // Get the category name
        const { data: updatedCategory, error: updatedCategoryError } = await supabase
          .from('categories')
          .select('name')
          .eq('id', updatedItem.category_id)
          .single();

        // Transform the data to match the frontend model
        const transformedUpdatedItem = {
          id: updatedItem.id,
          name: updatedItem.name,
          description: updatedItem.description,
          categoryId: updatedItem.category_id,
          categoryName: updatedCategory ? updatedCategory.name : 'Unknown',
          sku: updatedItem.sku,
          quantityAvailable: updatedItem.quantity_available,
          quantityReserved: updatedItem.quantity_reserved,
          unitPrice: updatedItem.unit_price,
          location: updatedItem.location,
          imageUrl: updatedItem.image_url,
          createdAt: updatedItem.created_at,
          updatedAt: updatedItem.updated_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(transformedUpdatedItem),
        };

      case 'delete':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Item ID is required' }),
          };
        }

        const deleteId = data.id;

        // Delete the item
        const { error: deleteError } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', deleteId);

        if (deleteError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error deleting item', error: deleteError.message }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Item deleted successfully' }),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid action' }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server error', error: error.message }),
    };
  }
};
