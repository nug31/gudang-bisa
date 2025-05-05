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
        // Get all users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, role, department, avatar_url, created_at')
          .order('name');

        if (usersError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error fetching users', error: usersError.message }),
          };
        }

        // Format the users to match the expected format
        const formattedUsers = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedUsers),
        };

      case 'getById':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        const id = data.id;

        // Get user by ID
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email, role, department, avatar_url, created_at')
          .eq('id', id)
          .single();

        if (userError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'User not found', error: userError.message }),
          };
        }

        // Format the user to match the expected format
        const formattedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedUser),
        };

      case 'update':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        const updateId = data.id;
        
        // Build the update object
        const updateData = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

        // If no fields to update, return error
        if (Object.keys(updateData).length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'No fields to update' }),
          };
        }

        // Update the user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', updateId)
          .select('id, name, email, role, department, avatar_url, created_at')
          .single();

        if (updateError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error updating user', error: updateError.message }),
          };
        }

        // Format the updated user to match the expected format
        const formattedUpdatedUser = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          avatarUrl: updatedUser.avatar_url,
          createdAt: updatedUser.created_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedUpdatedUser),
        };

      case 'delete':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        const deleteId = data.id;

        // Check if the user has any requests
        const { data: requests, error: requestsError } = await supabase
          .from('item_requests')
          .select('id')
          .eq('user_id', deleteId);

        if (requestsError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error checking user requests', error: requestsError.message }),
          };
        }

        if (requests.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Cannot delete user that has created requests' }),
          };
        }

        // Delete the user
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', deleteId);

        if (deleteError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error deleting user', error: deleteError.message }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'User deleted successfully' }),
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
