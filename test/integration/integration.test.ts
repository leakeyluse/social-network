import supertest from 'supertest';
import {server} from "../../config/config";
import {client, dbOps} from "../../db/db";
import app from "../../src/app";

const conn = app.listen(server.port, async(err) => {
    if (err) {
        return console.error(err);
    } 
});

const request = supertest(app);

describe('server test', () => {
    afterEach(async() => {
        return conn.close();
    });
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
 */
