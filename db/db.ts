import {config} from "dotenv";
import {Client} from "pg";

/*
 * NOTE
 * For all tables, no functions and triggers created for update timestamps
 * user_friends table add column accepted_at which is the updated timestamp for when the req was accepted
 */

config();
const {pgDb, pgPassword, pgHost, pgPort, pgUser} = process.env;

export const client = new Client ({
    user: pgUser,
    password: pgPassword,
    database: pgDb,
    host: pgHost,
    port: parseInt(pgPort),
    ssl: { rejectUnauthorized: false }
});

export const dbOps = {
    createUserTable: `
        CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL,
            "first_name" VARCHAR(100) NOT NULL,
            "last_name" VARCHAR(100) NOT NULL,
            "email" VARCHAR(100) NOT NULL,
            "passhash" VARCHAR(255) NOT NULL,
            "token" VARCHAR(255) NOT NULL,
            "login_attempts" INTEGER NOT NULL DEFAULT 0,
            "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id")
        );`,
    createFriendTable: `
        CREATE TABLE IF NOT EXISTS "user_friends" (
            "id" SERIAL,
            "user_id" INTEGER NOT NULL,
            "friend_id" INTEGER NOT NULL,
            "accepted" BOOLEAN NOT NULL DEFAULT FALSE,
            "requested_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("id")
        );`,
    addUser: `
        INSERT INTO "users" (first_name, last_name, email, passhash, token)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
        `,
    login: `
        SELECT *
        FROM "users"
        WHERE "email"=$1;
        `,
    userExists: `
        SELECT EXISTS
            (SELECT 1 FROM "users" where "email"=$1)
        AS "exists";
        `,
    getUserDetails: `
        SELECT *
        FROM "users"
        WHERE "email"=$1;
        `,
    userIsFriend:  `
        SELECT EXISTS
            ( 
                SELECT 1 FROM "user_friends"
                WHERE ("user_id"=$1 AND "friend_id"=$2)
                OR ("user_id"=$2 AND "friend_id"=$1)
            )
        AS "is_friend";
    `,
    checkFriendRequestStatus: `
        SELECT user_id, friend_id, accepted 
        FROM "user_friends"
        WHERE ("user_id"=$1 AND "friend_id"=$2)
        OR ("user_id"=$2 AND "friend_id"=$1)
        `,
    sendFriendRequest: `
        INSERT INTO "user_friends" (user_id, friend_id)
        VALUES ($1, $2)
        RETURNING *;
        `,
    resetLoginAttempts: `
        UPDATE "users"
        SET "login_attempts"=0
        WHERE email=$1
        RETURNING *;`,
    updateLoginAttempts: `
        UPDATE "users"
        SET "login_attempts"=login_attempts + 1
        WHERE email=$1
        RETURNING *;
            `,
    setToken: `
        UPDATE "users"
        SET "token"=$2
        WHERE email=$1
        RETURNING *;
            `
}