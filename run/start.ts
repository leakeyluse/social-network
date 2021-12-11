import app from "../src/app"
import {server} from "../config/config";
import {client} from "../db/db";

app.listen(server.port, async(err) => {
    if (err) {
        return console.error(err);
    }  
    await client.connect();
    return console.log(`Server listening on port ${server.port}`);
});