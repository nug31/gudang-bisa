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
            // Get all users
            $stmt = $pdo->query("
                SELECT
                    id,
                    name,
                    email,
                    role,
                    department,
                    avatar_url as avatarUrl,
                    created_at as createdAt
                FROM users
                ORDER BY name
            ");
            $users = $stmt->fetchAll();
            send_json($users);
            break;

        case 'getById':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'User ID is required'], 400);
            }

            $id = $data['id'];

            // Get user by ID
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    email,
                    role,
                    department,
                    avatar_url as avatarUrl,
                    created_at as createdAt
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                send_json(['message' => 'User not found'], 404);
            }

            send_json($user);
            break;

        case 'create':
            // Validate required fields
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['role'])) {
                send_json(['message' => 'Name, email, and role are required'], 400);
            }

            $name = $data['name'];
            $email = $data['email'];
            $role = $data['role'];
            $department = isset($data['department']) ? $data['department'] : null;
            $avatarUrl = isset($data['avatarUrl']) ? $data['avatarUrl'] : null;

            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->rowCount() > 0) {
                send_json(['message' => 'Email already exists'], 400);
            }

            // Generate a new UUID for the user
            $userId = generate_uuid();

            // Insert the new user
            $stmt = $pdo->prepare("
                INSERT INTO users (
                    id,
                    name,
                    email,
                    role,
                    department,
                    avatar_url,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $name, $email, $role, $department, $avatarUrl]);

            // Get the newly created user
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    email,
                    role,
                    department,
                    avatar_url as avatarUrl,
                    created_at as createdAt
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch();

            send_json($newUser, 201);
            break;

        case 'update':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'User ID is required'], 400);
            }

            $id = $data['id'];
            
            // Check if the user exists
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                send_json(['message' => 'User not found'], 404);
            }

            // Build the update query dynamically
            $updateFields = [];
            $updateValues = [];

            if (isset($data['name'])) {
                $updateFields[] = "name = ?";
                $updateValues[] = $data['name'];
            }

            if (isset($data['email'])) {
                // Check if the new email already exists
                if ($data['email'] !== $stmt->fetch()['email']) {
                    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                    $checkStmt->execute([$data['email'], $id]);
                    
                    if ($checkStmt->rowCount() > 0) {
                        send_json(['message' => 'Email already exists'], 400);
                    }
                }
                
                $updateFields[] = "email = ?";
                $updateValues[] = $data['email'];
            }

            if (isset($data['role'])) {
                $updateFields[] = "role = ?";
                $updateValues[] = $data['role'];
            }

            if (isset($data['department'])) {
                $updateFields[] = "department = ?";
                $updateValues[] = $data['department'];
            }

            if (isset($data['avatarUrl'])) {
                $updateFields[] = "avatar_url = ?";
                $updateValues[] = $data['avatarUrl'];
            }

            // If no fields to update, return error
            if (empty($updateFields)) {
                send_json(['message' => 'No fields to update'], 400);
            }

            // Execute the update query
            $updateQuery = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
            $updateValues[] = $id;
            
            $stmt = $pdo->prepare($updateQuery);
            $stmt->execute($updateValues);

            // Get the updated user
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    email,
                    role,
                    department,
                    avatar_url as avatarUrl,
                    created_at as createdAt
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $updatedUser = $stmt->fetch();

            send_json($updatedUser);
            break;

        case 'delete':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'User ID is required'], 400);
            }

            $id = $data['id'];
            
            // Check if the user exists
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                send_json(['message' => 'User not found'], 404);
            }

            // Check if the user is referenced in any requests
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM item_requests WHERE user_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                send_json(['message' => 'Cannot delete user that has created requests'], 400);
            }

            // Delete the user
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);

            send_json(['message' => 'User deleted successfully']);
            break;

        default:
            send_json(['message' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    send_json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
}
?>
