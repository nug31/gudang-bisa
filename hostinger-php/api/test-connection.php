<?php
require_once '../config.php';

try {
    // Test database connection
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    send_json([
        'success' => true,
        'message' => 'Database connected successfully',
        'test' => $result['test']
    ]);
} catch (PDOException $e) {
    send_json([
        'success' => false,
        'message' => 'Error connecting to database',
        'error' => $e->getMessage()
    ], 500);
}
?>
