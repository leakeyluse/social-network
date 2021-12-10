import express from 'express';
import cors from "cors";
import {server} from "../config/config";
import {pool} from "../db/db";

const app = express();

const isLoggedIn = () => {
    return 1;
}

app.get('/', async (req, res) => {
  res.end('Home to this very simple app');
});

app.post("/signup", async (req,res) => {
    try {
        const {firstName, lastname, email, password} = req.body;
       
        if(firstName && lastname && email && password){
            const passHash = password;
            const signupUser = await pool.query(`INSERT INTO users (first_name, last_name, email, password) VALUES (${firstName}, ${lastname}, ${email}, ${passHash}`);
            res.json(signupUser.rows[0]);
        } else {
            res.json({  
                success: false,
                error: true,
                message: "firstName, lastname, email, password required"
            })
        }
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/login", async (req,res) => {
    try {
        const {email, password} = req.body;
        const loginUser = await pool.query(`SELECT first_name, last_name, email FROM users WHERE email=${email} AND password=${password}`);
        res.json(loginUser.rows[0]);
        /*} else {
            res.json({  
                success: false,
                error: true,
                message: "firstName, lastname, email, password required"
            })
        }*/
    }  catch (err) {
       console.error(err.message);
    }
});

app.get("/getuser", async (req,res) => {
    try {
        if(isLoggedIn()) {
            const email:string = "hello";
            const getDetails = await pool.query(`SELECT first_name, last_name FROM users WHERE email=${email}`); 
            res.json(getDetails.rows[0]);
        } else {
            res.json({  
                success: false,
                error: true,
                message: "login required"
            })
        }
    }  catch (err) {
       console.error(err.message);
    }
});

app.listen(server.port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`Server listening on port ${server.port}`);
});