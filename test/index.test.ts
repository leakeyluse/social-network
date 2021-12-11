import express from 'express';
import bcrypt from 'bcryptjs';
import {verifyToken, validatePassword} from "../auth/auth";
import {server} from "../config/config";
import {client, dbOps} from "../db/db";

/*
 * db operations
 * NOTE
 * rollback not supported with current heroku billing settings
 * 
 * IMPORTANT: run tests before app then clear dbs to remove dummy data from tables
 */

// global, users
var user = {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@test.com",
    passHash: "hash",
    token: "token"
}

var userNotInDB = {
    firstName: "Jane",
    lastName: "Doe",
    email: "janedoe@test.com",
    passHash: "hash",
    token: "token"
}

// insert  
describe('testing insert user', async() => {
    beforeAll(async() => {
        await client.connect();
    });
    afterAll(async () => {
        await client.end();
    });
    it('should test', async () => {
        //const insert = await client.query(dbOps.addUser, [first]);
        //expect(insert[0]["result"]).toBe(1);
    })
});

// user exists
describe('testing user exists', async() => {
    beforeAll(async() => {
        await client.connect();
    });
    afterAll(async () => {
        await client.end();
    });
    it('should test', async () => {
        //const userExists = await client.query(dbOps.userExists({email: userNotInDB.email}) + " RETURNING *");
        //expect(userExists.rows[0]["exists"]).toBe(false);
    })
});