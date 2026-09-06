<?php
// db.php - Database connection helper that reads .env and provides a PDO singleton.

$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue; // skip comments/empty
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            // Only set if not already defined
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
            }
        }
    }
}

class DB {
    private static $pdo = null;
    public static function getConnection() {
        if (self::$pdo === null) {
            $host = $_ENV['MYSQL_HOST'] ?? '127.0.0.1';
            $port = $_ENV['MYSQL_PORT'] ?? '3306';
            $db   = $_ENV['MYSQL_DATABASE'] ?? '';
            $user = $_ENV['MYSQL_USER'] ?? 'root';
            $pass = $_ENV['MYSQL_PASSWORD'] ?? '';
            $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
            try {
                self::$pdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                // Ensure required tables exist
                self::initializeTables();
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
                exit;
            }
        }
        return self::$pdo;
    }

    private static function initializeTables() {
        $sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS site_theme (
    id INT PRIMARY KEY DEFAULT 1,
    data JSON NOT NULL
);
CREATE TABLE IF NOT EXISTS site_logo (
    id INT PRIMARY KEY DEFAULT 1,
    imageUrl VARCHAR(255),
    altText VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS ecosystem_brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brandName VARCHAR(100),
    logo VARCHAR(255),
    info TEXT
);
CREATE TABLE IF NOT EXISTS client_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    image VARCHAR(255),
    description TEXT
);
CREATE TABLE IF NOT EXISTS contact_submissions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    city VARCHAR(100),
    systemType VARCHAR(100),
    bill VARCHAR(100),
    message TEXT,
    date DATE,
    time TIME,
    status VARCHAR(20)
);
SQL;
        self::$pdo->exec($sql);
    }
}
?>
