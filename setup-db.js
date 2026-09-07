require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'solar',
        });

        console.log("Connected to MySQL database. Creating tables...");

        const statements = [
            `CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255)
            )`,
            `CREATE TABLE IF NOT EXISTS site_theme (
                id INT PRIMARY KEY DEFAULT 1,
                data JSON NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS site_logo (
                id INT PRIMARY KEY DEFAULT 1,
                imageUrl VARCHAR(255),
                altText VARCHAR(255)
            )`,
            `CREATE TABLE IF NOT EXISTS ecosystem_brands (
                id INT AUTO_INCREMENT PRIMARY KEY,
                brandName VARCHAR(100),
                logo LONGTEXT,
                info TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS client_photos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150),
                image LONGTEXT,
                description TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS contact_submissions (
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
            )`
        ];

        for (const sql of statements) {
            await connection.execute(sql);
            console.log("Executed:", sql.split('(')[0].trim());
        }

        console.log("All tables created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

initializeDatabase();
