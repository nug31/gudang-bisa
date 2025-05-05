<?php
require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['message' => 'Method not allowed'], 405);
}

// Get JSON data from request body
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['email']) || !isset($data['password'])) {
    send_json(['message' => 'Email and password are required'], 400);
}

$email = $data['email'];
$password = $data['password'];

try {
    // Find user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password, role, department, avatar_url as avatarUrl, created_at as createdAt FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        send_json(['message' => 'Invalid email or password'], 401);
    }

    // Store password and remove it from user object
    $stored_password = $user['password'];
    unset($user['password']);

    // Check if the password is correct
    // For backward compatibility, still accept 'password' as the password for all users
    $is_password_valid = ($password === 'password');

    // If the user has a hashed password, verify it
    if ($stored_password && substr($stored_password, 0, 1) === '$') {
        $is_password_valid = $is_password_valid || password_verify($password, $stored_password);
    }

    if (!$is_password_valid) {
        send_json(['message' => 'Invalid email or password'], 401);
    }

    // Return user data
    send_json([
        'user' => $user,
        'message' => 'Login successful'
    ]);
} catch (PDOException $e) {
    send_json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
}
?>
