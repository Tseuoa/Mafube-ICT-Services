CREATE DATABASE IF NOT EXISTS mafube_ict CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mafube_ict;
CREATE TABLE IF NOT EXISTS leads (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 company VARCHAR(200) NULL,
 email VARCHAR(255) NOT NULL,
 message TEXT NOT NULL,
 source VARCHAR(50) NOT NULL DEFAULT 'website',
 status ENUM('new','contacted','qualified','closed') NOT NULL DEFAULT 'new',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_status(status),
 INDEX idx_created(created_at)
);
CREATE TABLE IF NOT EXISTS products (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 category VARCHAR(100) NOT NULL,
 description TEXT,
 image_url VARCHAR(500),
 active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS services (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 description TEXT,
 active TINYINT(1) NOT NULL DEFAULT 1
);
INSERT INTO services(name,description) VALUES
('Hosted PBX & VoIP','Cloud business telephony, SIP/VoIP and IP deskphones.'),
('IP Telephony','Business calling, extensions and telephony management.'),
('Unified Communications','Presence, messaging, voicemail, recordings and collaboration.'),
('Contact Centre','Customer communication, agents and reporting.'),
('Connectivity','Fibre, internet, LTE/5G and networking.'),
('IT Products & Support','Computers, peripherals, networking and IT support.');
