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

  const path = event.path.replace('/.netlify/functions/item-requests', '');
  const segments = path.split('/').filter(Boolean);
  const id = segments[0];

  try {
    // GET /item-requests - Get all item requests
    if (event.httpMethod === 'GET' && !id) {
      const params = event.queryStringParameters || {};
      const { status, user_id } = params;
      
      let query = supabase
        .from('item_requests')
        .select(`
          *,
          user:user_id (id, name, email, department),
          category:category_id (id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // GET /item-requests/:id - Get item request by ID
    if (event.httpMethod === 'GET' && id) {
      const { data, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          user:user_id (id, name, email, department),
          category:category_id (id, name),
          approver:approved_by (id, name),
          rejecter:rejected_by (id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Item request not found' })
        };
      }
      
      // Get comments for this request
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (id, name, avatar_url)
        `)
        .eq('item_request_id', id)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;
      
      // Combine request with comments
      const requestWithComments = {
        ...data,
        comments: comments || []
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(requestWithComments)
      };
    }
    
    // POST /item-requests - Create new item request
    if (event.httpMethod === 'POST') {
      const {
        title,
        description,
        category_id,
        priority,
        user_id,
        quantity,
        total_cost
      } = JSON.parse(event.body);
      
      // Create new item request
      const { data, error } = await supabase
        .from('item_requests')
        .insert([
          {
            id: uuidv4(),
            title,
            description,
            category_id,
            priority: priority || 'medium',
            status: 'pending',
            user_id,
            quantity: quantity || 1,
            total_cost,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      // Create notification for admins and managers
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'manager']);
      
      if (adminsError) throw adminsError;
      
      // Get user name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user_id)
        .single();
      
      if (userError) throw userError;
      
      // Create notifications for each admin/manager
      const notifications = admins.map(admin => ({
        id: uuidv4(),
        user_id: admin.id,
        type: 'request_submitted',
        message: `New request "${title}" submitted by ${userData.name}`,
        is_read: false,
        created_at: new Date().toISOString(),
        related_item_id: data[0].id
      }));
      
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      }
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // PUT /item-requests/:id - Update item request
    if (event.httpMethod === 'PUT' && id) {
      const {
        title,
        description,
        category_id,
        priority,
        status,
        quantity,
        total_cost,
        approved_by,
        rejected_by,
        rejection_reason
      } = JSON.parse(event.body);
      
      // Get the current request to check for status changes
      const { data: currentRequest, error: currentRequestError } = await supabase
        .from('item_requests')
        .select('status, user_id, title')
        .eq('id', id)
        .single();
      
      if (currentRequestError) throw currentRequestError;
      
      const updateData = {
        title,
        description,
        category_id,
        priority,
        status,
        quantity,
        total_cost,
        updated_at: new Date().toISOString()
      };
      
      // Add approval/rejection data if status changed
      if (status === 'approved' && currentRequest.status !== 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = approved_by;
      } else if (status === 'rejected' && currentRequest.status !== 'rejected') {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = rejected_by;
        updateData.rejection_reason = rejection_reason;
      } else if (status === 'fulfilled' && currentRequest.status !== 'fulfilled') {
        updateData.fulfillment_date = new Date().toISOString();
      }
      
      // Update item request
      const { data, error } = await supabase
        .from('item_requests')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Create notification for status changes
      if (status && status !== currentRequest.status) {
        let notificationType = '';
        let message = '';
        
        if (status === 'approved') {
          notificationType = 'request_approved';
          message = `Your request "${currentRequest.title}" has been approved`;
        } else if (status === 'rejected') {
          notificationType = 'request_rejected';
          message = `Your request "${currentRequest.title}" has been rejected`;
        } else if (status === 'fulfilled') {
          notificationType = 'request_fulfilled';
          message = `Your request "${currentRequest.title}" has been fulfilled`;
        }
        
        if (notificationType) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert([{
              id: uuidv4(),
              user_id: currentRequest.user_id,
              type: notificationType,
              message,
              is_read: false,
              created_at: new Date().toISOString(),
              related_item_id: id
            }]);
          
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // DELETE /item-requests/:id - Delete item request
    if (event.httpMethod === 'DELETE' && id) {
      // Delete item request
      const { error } = await supabase
        .from('item_requests')
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
