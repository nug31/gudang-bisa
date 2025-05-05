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
        // Get all requests
        const { data: requests, error: requestsError } = await supabase
          .from('item_requests')
          .select(`
            id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            created_at,
            updated_at,
            approved_at,
            approved_by,
            rejected_at,
            rejected_by,
            rejection_reason,
            fulfillment_date,
            quantity,
            categories (id, name)
          `)
          .order('created_at', { ascending: false });

        if (requestsError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error fetching requests', error: requestsError.message }),
          };
        }

        // Format the requests to match the expected format
        const formattedRequests = requests.map(request => ({
          id: request.id,
          title: request.title,
          description: request.description,
          category: request.categories.id,
          priority: request.priority,
          status: request.status,
          userId: request.user_id,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          approvedAt: request.approved_at,
          approvedBy: request.approved_by,
          rejectedAt: request.rejected_at,
          rejectedBy: request.rejected_by,
          rejectionReason: request.rejection_reason,
          fulfillmentDate: request.fulfillment_date,
          quantity: request.quantity
        }));

        // Get comments for each request
        for (const request of formattedRequests) {
          const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('id, request_id, user_id, content, created_at')
            .eq('request_id', request.id);

          if (!commentsError) {
            request.comments = comments.map(comment => ({
              id: comment.id,
              requestId: comment.request_id,
              userId: comment.user_id,
              content: comment.content,
              createdAt: comment.created_at
            }));
          } else {
            request.comments = [];
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedRequests),
        };

      case 'getById':
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Request ID is required' }),
          };
        }

        const id = data.id;

        // Get request by ID
        const { data: request, error: requestError } = await supabase
          .from('item_requests')
          .select(`
            id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            created_at,
            updated_at,
            approved_at,
            approved_by,
            rejected_at,
            rejected_by,
            rejection_reason,
            fulfillment_date,
            quantity,
            categories (id, name)
          `)
          .eq('id', id)
          .single();

        if (requestError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Request not found', error: requestError.message }),
          };
        }

        // Format the request to match the expected format
        const formattedRequest = {
          id: request.id,
          title: request.title,
          description: request.description,
          category: request.categories.id,
          priority: request.priority,
          status: request.status,
          userId: request.user_id,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          approvedAt: request.approved_at,
          approvedBy: request.approved_by,
          rejectedAt: request.rejected_at,
          rejectedBy: request.rejected_by,
          rejectionReason: request.rejection_reason,
          fulfillmentDate: request.fulfillment_date,
          quantity: request.quantity
        };

        // Get comments for the request
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('id, request_id, user_id, content, created_at')
          .eq('request_id', id);

        if (!commentsError) {
          formattedRequest.comments = comments.map(comment => ({
            id: comment.id,
            requestId: comment.request_id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: comment.created_at
          }));
        } else {
          formattedRequest.comments = [];
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedRequest),
        };

      case 'create':
        // Validate request data
        if (!data.request) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Request data is required' }),
          };
        }

        const newRequest = data.request;
        
        // Insert the request
        const { data: createdRequest, error: createError } = await supabase
          .from('item_requests')
          .insert([
            {
              id: newRequest.id,
              title: newRequest.title,
              description: newRequest.description,
              category_id: newRequest.category,
              priority: newRequest.priority,
              status: newRequest.status,
              user_id: newRequest.userId,
              quantity: newRequest.quantity,
              fulfillment_date: newRequest.fulfillmentDate,
              inventory_item_id: newRequest.inventoryItemId
            }
          ])
          .select(`
            id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            created_at,
            updated_at,
            quantity,
            fulfillment_date,
            inventory_item_id,
            categories (id, name)
          `)
          .single();

        if (createError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error creating request', error: createError.message }),
          };
        }

        // Format the created request to match the expected format
        const formattedCreatedRequest = {
          id: createdRequest.id,
          title: createdRequest.title,
          description: createdRequest.description,
          category: createdRequest.categories.id,
          categoryName: createdRequest.categories.name,
          priority: createdRequest.priority,
          status: createdRequest.status,
          userId: createdRequest.user_id,
          createdAt: createdRequest.created_at,
          updatedAt: createdRequest.updated_at,
          quantity: createdRequest.quantity,
          fulfillmentDate: createdRequest.fulfillment_date,
          inventoryItemId: createdRequest.inventory_item_id
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(formattedCreatedRequest),
        };

      case 'addComment':
        // Validate comment data
        if (!data.comment) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Comment data is required' }),
          };
        }

        const newComment = data.comment;
        
        // Insert the comment
        const { data: createdComment, error: commentError } = await supabase
          .from('comments')
          .insert([
            {
              id: newComment.id,
              request_id: newComment.requestId,
              user_id: newComment.userId,
              content: newComment.content,
              created_at: newComment.createdAt || new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (commentError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error creating comment', error: commentError.message }),
          };
        }

        // Format the created comment to match the expected format
        const formattedComment = {
          id: createdComment.id,
          requestId: createdComment.request_id,
          userId: createdComment.user_id,
          content: createdComment.content,
          createdAt: createdComment.created_at
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(formattedComment),
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
