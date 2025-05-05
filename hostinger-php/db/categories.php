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
            // Get all categories
            $stmt = $pdo->query("
                SELECT
                    id,
                    name,
                    description
                FROM categories
                ORDER BY name
            ");
            $categories = $stmt->fetchAll();

            // Get item counts for each category
            foreach ($categories as &$category) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count 
                    FROM inventory_items 
                    WHERE category_id = ?
                ");
                $stmt->execute([$category['id']]);
                $result = $stmt->fetch();
                $category['itemCount'] = $result['count'];
            }

            send_json($categories);
            break;

        case 'getById':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'Category ID is required'], 400);
            }

            $id = $data['id'];

            // Get category by ID
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    description
                FROM categories
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $category = $stmt->fetch();

            if (!$category) {
                send_json(['message' => 'Category not found'], 404);
            }

            // Get item count for the category
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM inventory_items 
                WHERE category_id = ?
            ");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            $category['itemCount'] = $result['count'];

            send_json($category);
            break;

        case 'create':
            // Validate required fields
            if (!isset($data['name'])) {
                send_json(['message' => 'Category name is required'], 400);
            }

            $name = $data['name'];
            $description = isset($data['description']) ? $data['description'] : null;

            // Generate a new UUID for the category
            $categoryId = generate_uuid();

            // Insert the new category
            $stmt = $pdo->prepare("
                INSERT INTO categories (
                    id,
                    name,
                    description
                ) VALUES (?, ?, ?)
            ");
            $stmt->execute([$categoryId, $name, $description]);

            // Get the newly created category
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    description
                FROM categories
                WHERE id = ?
            ");
            $stmt->execute([$categoryId]);
            $newCategory = $stmt->fetch();
            $newCategory['itemCount'] = 0;

            send_json($newCategory, 201);
            break;

        case 'update':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'Category ID is required'], 400);
            }

            $id = $data['id'];
            
            // Check if the category exists
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                send_json(['message' => 'Category not found'], 404);
            }

            // Build the update query dynamically
            $updateFields = [];
            $updateValues = [];

            if (isset($data['name'])) {
                $updateFields[] = "name = ?";
                $updateValues[] = $data['name'];
            }

            if (isset($data['description'])) {
                $updateFields[] = "description = ?";
                $updateValues[] = $data['description'];
            }

            // If no fields to update, return error
            if (empty($updateFields)) {
                send_json(['message' => 'No fields to update'], 400);
            }

            // Execute the update query
            $updateQuery = "UPDATE categories SET " . implode(", ", $updateFields) . " WHERE id = ?";
            $updateValues[] = $id;
            
            $stmt = $pdo->prepare($updateQuery);
            $stmt->execute($updateValues);

            // Get the updated category
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    name,
                    description
                FROM categories
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $updatedCategory = $stmt->fetch();

            // Get item count for the category
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM inventory_items 
                WHERE category_id = ?
            ");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            $updatedCategory['itemCount'] = $result['count'];

            send_json($updatedCategory);
            break;

        case 'delete':
            // Validate ID
            if (!isset($data['id'])) {
                send_json(['message' => 'Category ID is required'], 400);
            }

            $id = $data['id'];
            
            // Check if the category exists
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                send_json(['message' => 'Category not found'], 404);
            }

            // Check if the category is referenced in any inventory items
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                send_json(['message' => 'Cannot delete category that has inventory items'], 400);
            }

            // Check if the category is referenced in any requests
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM item_requests WHERE category_id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                send_json(['message' => 'Cannot delete category that has requests'], 400);
            }

            // Delete the category
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);

            send_json(['message' => 'Category deleted successfully']);
            break;

        default:
            send_json(['message' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    send_json(['message' => 'Database error', 'error' => $e->getMessage()], 500);
}
?>
