const supabase = require('./supabase-client');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  const path = event.path.replace('/.netlify/functions/categories', '');
  const segments = path.split('/').filter(Boolean);
  const id = segments[0];

  try {
    // GET /categories - Get all categories
    if (event.httpMethod === 'GET' && !id) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // GET /categories/:id - Get category by ID
    if (event.httpMethod === 'GET' && id) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Category not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // POST /categories - Create new category
    if (event.httpMethod === 'POST') {
      const { name, description } = JSON.parse(event.body);
      
      // Create new category
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            id: uuidv4(),
            name,
            description,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // PUT /categories/:id - Update category
    if (event.httpMethod === 'PUT' && id) {
      const { name, description } = JSON.parse(event.body);
      
      // Update category
      const { data, error } = await supabase
        .from('categories')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // DELETE /categories/:id - Delete category
    if (event.httpMethod === 'DELETE' && id) {
      // Delete category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
