import {config} from "dotenv";
import Pool from "pool";

config();

const {pgDb, pgPassword, pgHost, pgPort, pgUser} = process.env;

export const pool = new Pool ({
    user: pgUser,
    password: pgPassword,
    database: pgDb,
    host: pgHost,
    port: parseInt(pgPort),
    ssl: false,
    max: 20,
    idleTimeoutMillis: 10000
});