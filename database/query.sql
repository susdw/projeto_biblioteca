CREATE DATABASE IF NOT EXISTS biblioteca;
USE biblioteca;

CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    zip_code VARCHAR(10) NOT NULL,
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    number VARCHAR(20),
    street VARCHAR(255) NOT NULL,
    complement VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address_id INT,
    active BOOLEAN DEFAULT TRUE,
    role ENUM('client', 'admin') NOT NULL DEFAULT 'client',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_customer_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    cover_image VARCHAR(500) NULL,
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_authors (
    product_id INT,
    author_id INT,
    PRIMARY KEY (product_id, author_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_value DECIMAL(10, 2) NOT NULL,
    status ENUM('processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_order_customer (customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    product_id INT,
    order_id INT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method ENUM('credit_card', 'debit_card', 'pix', 'cash') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    order_id INT UNIQUE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    a.street,
    c.password,
    a.number,
    a.neighborhood,
    a.city,
    a.state,
    a.zip_code
FROM customers c
LEFT JOIN addresses a ON c.address_id = a.id;

SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock,
    p.status,
    p.cover_image,
    c.name AS category,
    GROUP_CONCAT(a.name SEPARATOR ', ') AS authors
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_authors pa ON p.id = pa.product_id
LEFT JOIN authors a ON pa.author_id = a.id
GROUP BY p.id;

UPDATE customers SET role = 'client' WHERE email = 'izacfranca23@gmail.com'