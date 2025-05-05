const supabase = require('./supabase-client');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  const path = event.path.replace('/.netlify/functions/notifications', '');
  const segments = path.split('/').filter(Boolean);
  const userId = segments[0];
  const action = segments[1];
  const id = segments[2];

  try {
    // GET /notifications/:userId - Get notifications for user
    if (event.httpMethod === 'GET' && userId && !action) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // PUT /notifications/:id - Update notification
    if (event.httpMethod === 'PUT' && !userId && !action) {
      const id = segments[0];
      const { is_read } = JSON.parse(event.body);
      
      // Update notification
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // PUT /notifications/mark-all-read/:userId - Mark all notifications as read
    if (event.httpMethod === 'PUT' && action === 'mark-all-read') {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

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
