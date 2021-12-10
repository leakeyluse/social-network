import {config} from "dotenv";
import {Client} from "pg";

config();
const {pgDb, pgPassword, pgHost, pgPort, pgUser} = process.env;

export const pool = new Client ({
    user: pgUser,
    password: pgPassword,
    database: pgDb,
    host: pgHost,
    port: parseInt(pgPort),
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 10000
});

export const dbOps = {
    createUserTable: `
        CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL,
            "first_name" VARCHAR(100) NOT NULL,
            "last_name" VARCHAR(100) NOT NULL,
            "email" VARCHAR(100) NOT NULL,
            "password" VARCHAR(255) NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id")
        );`,
    createFollowerTable: `
        CREATE TABLE IF NOT EXISTS "user_followers" (
            "id" SERIAL,
            "email" VARCHAR(100) NOT NULL,
            "password" VARCHAR(255) NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id")
        );`,
    addUser: ({firstName, lastName, email, passHash, token}) => `
        INSERT INTO users (first_name, last_name, email, password, token)
        VALUES (${firstName}, ${lastName}, ${email}, ${passHash}, ${token});
        `,
    findOneUser: ({email}) => `
        SELECT * FROM users WHERE "email"=${email};
        `
}