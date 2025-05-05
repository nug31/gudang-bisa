<?php
// Try different username formats
$hosts = [
    "109.110.188.204",
    "gudang.nugjo.com",
    "localhost"
];

$usernames = [
    "oyishhkx_gudang",
    "oyishhkx_gudang@localhost",
    "oyishhkx_gudang@109.110.188.204",
    "oyishhkx_gudang@%"
];

$password = "Reddevils94_08";
$database = "oyishhkx_gudang";
$port = 3306;

echo "Testing multiple database connection configurations:\n\n";

foreach ($hosts as $host) {
    foreach ($usernames as $username) {
        echo "Configuration:\n";
        echo "Host: $host\n";
        echo "User: $username\n";
        echo "Database: $database\n";
        echo "Port: $port\n";
        
        // Create connection
        try {
            $conn = new mysqli($host, $username, $password, $database, $port);
            
            // Check connection
            if ($conn->connect_error) {
                echo "❌ Connection failed: " . $conn->connect_error . "\n";
            } else {
                echo "✅ Connection successful!\n";
                
                // Test a simple query
                $result = $conn->query("SELECT 1 as test");
                if ($result) {
                    echo "✅ Query successful!\n";
                    $row = $result->fetch_assoc();
                    echo "Result: " . print_r($row, true) . "\n";
                } else {
                    echo "❌ Query failed: " . $conn->error . "\n";
                }
                
                // Close connection
                $conn->close();
                echo "Connection closed.\n";
            }
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
        }
        
        echo "\n-----------------------------------\n\n";
    }
}

echo "All configurations tested.\n";
?>
