<?php
require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['message' => 'Method not allowed'], 405);
}

// Get JSON data from request body
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['role'])) {
    send_json(['message' => 'Name, email, password, and role are required'], 400);
}

$name = $data['name'];
$email = $data['email'];
$password = $data['password'];
$role = $data['role'];
$department = isset($data['department']) ? $data['department'] : null;

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        send_json(['message' => 'Email already exists'], 400);
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Generate a new UUID for the user
    $user_id = generate_uuid();

    // Insert the new user
    $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$user_id, $name, $email, $hashed_password, $role, $department]);

    // Get the newly created user (without password)
    $stmt = $pdo->prepare("SELECT id, name, email, role, department, avatar_url as avatarUrl, created_at as createdAt FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $new_user = $stmt->fetch();

    // Return success response
    send_json([
        'user' => $new_user,
        'message' => 'Registration successful'
    ], 201);
} catch (PDOException $e) {
    send_json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
}
?>
