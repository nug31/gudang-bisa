<?php
require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['message' => 'Method not allowed'], 405);
}

// Get JSON data from request body
$data = json_decode(file_get_contents('php://input'), true);

// Validate action
if (!isset($data['action'])) {
    send_json(['message' => 'Action is required'], 400);
}

$action = $data['action'];

try {
    switch ($action) {
        case 'getAll':
            // Get all requests
            $stmt = $pdo->query("
                SELECT
                    ir.id,
                    ir.title,
                    ir.description,
                    c.id as category,
                    ir.priority,
                    ir.status,
                    ir.user_id as userId,
                    ir.created_at as createdAt,
                    ir.updated_at as updatedAt,
                    ir.approved_at as approvedAt,
                    ir.approved_by as approvedBy,
                    ir.rejected_at as rejectedAt,
                    ir.rejected_by as rejectedBy,
                    ir.rejection_reason as rejectionReason,
                    ir.fulfillment_date as fulfillmentDate,
                    ir.quantity
                FROM item_requests ir
                JOIN categories c ON ir.category_id = c.id
            ");
            $requests = $stmt->fetchAll();

            // Get comments for each request
            foreach ($requests as &$request) {
                $stmt = $pdo->prepare("
                    SELECT
                        id,
                        request_id as requestId,
                        user_id as userId,
                        content,
                        created_at as createdAt
                    FROM comments
                    WHERE request_id = ?
                ");
                $stmt->execute([$request['id']]);
                $request['comments'] = $stmt->fetchAll();
            }

            send_json($requests);
            break;

        case 'getById':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'Request ID is required'], 400);
            }

            $id = $data['id'];

            // Get request by ID
            $stmt = $pdo->prepare("
                SELECT
                    ir.id,
                    ir.title,
                    ir.description,
                    c.id as category,
                    ir.priority,
                    ir.status,
                    ir.user_id as userId,
                    ir.created_at as createdAt,
                    ir.updated_at as updatedAt,
                    ir.approved_at as approvedAt,
                    ir.approved_by as approvedBy,
                    ir.rejected_at as rejectedAt,
                    ir.rejected_by as rejectedBy,
                    ir.rejection_reason as rejectionReason,
                    ir.fulfillment_date as fulfillmentDate,
                    ir.quantity
                FROM item_requests ir
                JOIN categories c ON ir.category_id = c.id
                WHERE ir.id = ?
            ");
            $stmt->execute([$id]);
            $request = $stmt->fetch();

            if (!$request) {
                send_json(['message' => 'Request not found'], 404);
            }

            // Get comments for the request
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    request_id as requestId,
                    user_id as userId,
                    content,
                    created_at as createdAt
                FROM comments
                WHERE request_id = ?
            ");
            $stmt->execute([$id]);
            $request['comments'] = $stmt->fetchAll();

            send_json($request);
            break;

        case 'create':
            // Validate request data
            if (!isset($data['request'])) {
                send_json(['message' => 'Request data is required'], 400);
            }

            $request = $data['request'];
            
            // Extract request data
            $id = isset($request['id']) ? $request['id'] : generate_uuid();
            $title = $request['title'];
            $description = $request['description'];
            $category = $request['category'];
            $priority = $request['priority'];
            $status = $request['status'];
            $userId = $request['userId'];
            $quantity = $request['quantity'];
            $fulfillmentDate = isset($request['fulfillmentDate']) ? $request['fulfillmentDate'] : null;
            $inventoryItemId = isset($request['inventoryItemId']) ? $request['inventoryItemId'] : null;

            // Insert the request
            $stmt = $pdo->prepare("
                INSERT INTO item_requests (
                    id,
                    title,
                    description,
                    category_id,
                    priority,
                    status,
                    user_id,
                    quantity,
                    fulfillment_date,
                    inventory_item_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $title,
                $description,
                $category,
                $priority,
                $status,
                $userId,
                $quantity,
                $fulfillmentDate,
                $inventoryItemId
            ]);

            // Get the created request
            $stmt = $pdo->prepare("
                SELECT
                    ir.id,
                    ir.title,
                    ir.description,
                    c.id as category,
                    c.name as categoryName,
                    ir.priority,
                    ir.status,
                    ir.user_id as userId,
                    ir.created_at as createdAt,
                    ir.updated_at as updatedAt,
                    ir.quantity,
                    ir.fulfillment_date as fulfillmentDate,
                    ir.inventory_item_id as inventoryItemId
                FROM item_requests ir
                JOIN categories c ON ir.category_id = c.id
                WHERE ir.id = ?
            ");
            $stmt->execute([$id]);
            $createdRequest = $stmt->fetch();

            send_json($createdRequest);
            break;

        case 'addComment':
            // Validate comment data
            if (!isset($data['comment'])) {
                send_json(['message' => 'Comment data is required'], 400);
            }

            $comment = $data['comment'];
            
            // Extract comment data
            $commentId = isset($comment['id']) ? $comment['id'] : generate_uuid();
            $requestId = $comment['requestId'];
            $userId = $comment['userId'];
            $content = $comment['content'];
            $createdAt = isset($comment['createdAt']) ? $comment['createdAt'] : date('Y-m-d H:i:s');

            // Insert the comment
            $stmt = $pdo->prepare("
                INSERT INTO comments (
                    id,
                    request_id,
                    user_id,
                    content,
                    created_at
                ) VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $commentId,
                $requestId,
                $userId,
                $content,
                $createdAt
            ]);

            // Get the created comment
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    request_id as requestId,
                    user_id as userId,
                    content,
                    created_at as createdAt
                FROM comments
                WHERE id = ?
            ");
            $stmt->execute([$commentId]);
            $createdComment = $stmt->fetch();

            send_json($createdComment);
            break;

        default:
            send_json(['message' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    send_json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
}
?>
