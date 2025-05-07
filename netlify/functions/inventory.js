const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  try {
    // Parse request body for POST, PUT methods
    let data = {};
    if (event.body) {
      data = JSON.parse(event.body);
    }

    // Extract path parameters
    const path = event.path.replace('/.netlify/functions/inventory', '');
    const segments = path.split('/').filter(segment => segment);
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        // Get all inventory items
        if (segments.length === 0) {
          const { data: items, error } = await supabase
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

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ message: 'Error fetching inventory items', error: error.message }),
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
        }
        
        // Get inventory item by ID
        if (segments.length === 1) {
          const id = segments[0];
          
          const { data: item, error } = await supabase
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

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: 'Item not found', error: error.message }),
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
        }
        
        // Get inventory items by category
        if (segments.length === 2 && segments[0] === 'category') {
          const categoryId = segments[1];
          
          const { data: items, error } = await supabase
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
            .eq('category_id', categoryId)
            .order('name');

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ message: 'Error fetching inventory items', error: error.message }),
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
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Not found' }),
        };

      case 'POST':
        // Create a new inventory item
        if (segments.length === 0) {
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
          const { data: createdItem, error } = await supabase
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

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ message: 'Error creating item', error: error.message }),
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
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Not found' }),
        };

      case 'PUT':
        // Update an inventory item
        if (segments.length === 1) {
          const id = segments[0];
          
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
          const { data: updatedItem, error } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ message: 'Error updating item', error: error.message }),
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
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Not found' }),
        };

      case 'DELETE':
        // Delete an inventory item
        if (segments.length === 1) {
          const id = segments[0];
          
          const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ message: 'Error deleting item', error: error.message }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Item deleted successfully' }),
          };
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Not found' }),
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Method not allowed' }),
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
