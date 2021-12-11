CREATE DATABASE social_netwrk;

CREATE TABLE users (
    id SERIAL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    passhash VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    blocked_login_token VARCHAR(255) NOT NULL DEFAULT 0,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE user_friends (
    id SERIAL,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    requested_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);