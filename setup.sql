CREATE DATABASE IF NOT EXISTS chat_room;
USE chat_room;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    online VARCHAR(10) DEFAULT 'false',
    bookmarked TEXT DEFAULT '[]',
    pending TEXT DEFAULT '[]',
    friends TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    admin VARCHAR(255) NOT NULL,
    users TEXT DEFAULT '',
    messages TEXT DEFAULT '[]',
    muted TEXT DEFAULT '[]',
    banned TEXT DEFAULT '[]'
);
