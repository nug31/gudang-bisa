<?php
// Database credentials
$host = "109.110.188.204";
$username = "oyishhkx_gudang";
$password = "Reddevils94_08";
$database = "oyishhkx_gudang";
$port = 3306;

echo "Testing database connection with the following settings:\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "User: $username\n";
echo "Database: $database\n";
echo "Password: [HIDDEN]\n\n";

// Create connection
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
?>
