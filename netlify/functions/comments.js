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

  const path = event.path.replace('/.netlify/functions/comments', '');
  const segments = path.split('/').filter(Boolean);
  const id = segments[0];

  try {
    // POST /comments - Create new comment
    if (event.httpMethod === 'POST') {
      const { item_request_id, user_id, content } = JSON.parse(event.body);
      
      // Create new comment
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            id: uuidv4(),
            item_request_id,
            user_id,
            content,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      // Get the request and user info
      const { data: request, error: requestError } = await supabase
        .from('item_requests')
        .select('user_id, title')
        .eq('id', item_request_id)
        .single();
      
      if (requestError) throw requestError;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user_id)
        .single();
      
      if (userError) throw userError;
      
      // Create notification for the request owner (if not the commenter)
      if (request.user_id !== user_id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{
            id: uuidv4(),
            user_id: request.user_id,
            type: 'comment_added',
            message: `${userData.name} commented on your request "${request.title}"`,
            is_read: false,
            created_at: new Date().toISOString(),
            related_item_id: item_request_id
          }]);
        
        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
      
      // Get user info for the response
      const { data: commentWithUser, error: commentError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (id, name, avatar_url)
        `)
        .eq('id', data[0].id)
        .single();
      
      if (commentError) throw commentError;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(commentWithUser)
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
