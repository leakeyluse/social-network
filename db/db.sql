CREATE DATABASE social_app;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY, 
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    pass_hash VARCHAR(255),
	created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);