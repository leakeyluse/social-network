import app from "../../src/app";
import supertest from 'supertest';
import {server} from "../../config/config";
import {client, dbOps} from "../../db/db";
import {dummyUsers} from "../helpers/integration-helpers";

const serverConn = app.listen(server.port, async(err) => {
    if (err) {
        return console.error(err);
    } 
    await client.connect();
});

describe('server test', () => {
    const request = supertest(app);
    it('can connect to server', async() => {
        const response = await request.get('/test');
        expect(response.status).toBe(200)
        expect(response.body.connection).toBe(true);
    });
});

/*
 * db operations
 * NOTE
 * rollback not supported with current heroku billing settings
 * IMPORTANT: run tests first then clear dbs to remove dummy data from tables
 * Running 6 tests. Every other query depends on these
 */

describe('database test', () => {
    afterAll(async() => {
        await client.end();
        serverConn.close();
        return;
    })
    it('can connect to database', async () => {
        expect(client).toBeTruthy();
    })
    it('can insert to db', async () => {
        const {firstName, lastName, email, password, token} = dummyUsers.inDB;
        const insert = await client.query(dbOps.addUser, [firstName, lastName, email, password, token]);
        expect(insert.rows[0]["email"]).toBe(email);
    })
    it('can check if record exists', async () => {        
        const {email} = dummyUsers.inDB;
        const checkExisting = await client.query(dbOps.userExists, [email]);
        expect(checkExisting.rows[0]["exists"]).toBe(true);  
    })
    it('can update record', async () => {        
        const {email} = dummyUsers.inDB;      
        const newEmail:string = "new@test.com";
        const updateEmail = await client.query(dbOps.updateEmail, [email, newEmail]);
        expect(updateEmail.rows[0]["email"]).toBe(newEmail); 

        const revertEmail = await client.query(dbOps.updateEmail, [newEmail, email]);
        expect(revertEmail.rows[0]["email"]).toBe(email);  
    })
    it('can get record', async () => {     
        const {email} = dummyUsers.inDB;
        const getUser = await client.query(dbOps.getUserDetails, [email]);
        expect(getUser.rows[0]["email"]).toBe(email);
    })
    it('can delete record', async () => {        
        const {email} = dummyUsers.inDB;
        const deleteUser = await client.query(dbOps.deleteUser, [email]);
        expect(deleteUser.rows[0]["email"]).toBe(email);
    })
});