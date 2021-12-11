import express from 'express';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';

import {createToken, isBlocked, isLoggedIn, validatePassword, verifyToken} from "../auth/auth";
import {client, dbOps} from "../db/db";


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/test', async (req, res) => {
    return res.status(200).json({
        connection: true
    });
});

app.get('/', async (req, res) => {
    return res.end(`Home to this very simple app.
        Paths: /login /signup /getuser /seefriends /sendrequest/{email} /acceptrequest/{email}`  
    );
});

app.post("/signup", async (req,res) => {
    try {
        const {firstName, lastName, email, password} = req.body;
        if(!(firstName && lastName && email && password)) {
            return res.json({  
                success: false,
                error: true,
                message: "Invalid data: firstName, lastname, email, password required"
            })
        }
        if(!validatePassword(password)) {
            return res.json({  
                success: false,
                error: true,
                message: `
                    password must have at least 1: uppercase letter, lowercase letter, number, special character (!@#$&*), length between 8 and 20 chars
                `
            }) 
        }
        const token:string = createToken(email);
        const passHash:string = await bcrypt.hash(password, 10);
        const userExists =  await client.query(dbOps.userExists, [email]);
        if(userExists.rows[0]["exists"]) {
            return res.json({  
                success: false,
                error: true,
                message: `User with email ${email} exists. Use a different email or login instead`
            }) 
        }
        const signupUser = await client.query(dbOps.addUser, [firstName, lastName, email, passHash, token]);
        return res.json(signupUser.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/login", async (req,res) => {
    try {
        const {email, password} = req.body;

        if(!(email && password)) {
            return res.json({  
                success: false,
                error: true,
                message: "Invalid data: Email, password required"
            })
        }

        const userExists =  await client.query(dbOps.userExists, [email]);
        if(!userExists.rows[0]["exists"]) {
            return res.json({  
                success: false,
                error: true,
                message: `User with email ${email} not found. Signup instead`
            })                
        }

        const loginUser = await client.query(dbOps.login, [email]);
        const user = loginUser.rows[0];
        const isBlockedToken = isBlocked(user.blocked_login_token);

        if(isBlockedToken || user.login_attempts >= 5) {
            if(isBlockedToken) {
                return res.json({  
                    success: false,
                    error: true,
                    message: `Try again after ${(isBlockedToken.exp - Date.now()/1000)/60} minutes. Blocked for too many wrong login attempts`
                })
            }
            const blockToken:string = createToken(email);
            await client.query(dbOps.resetLoginAttempts, [email]);
            await client.query(dbOps.blockUser, [email, blockToken]);
            return res.json({  
                success: false,
                error: true,
                message: `Too many wrong login attempts. Blocked for 1hour`
            })
        }

        if(!await bcrypt.compare(password, user.passhash)) {
            await client.query(dbOps.updateLoginAttempts, [email]);
            return res.json({  
                success: false,
                error: true,
                message: `Invalid credentials`,
                attempts: user.login_attempts + 1
            })                
        }

        const token:string = createToken(email);
        await client.query(dbOps.resetLoginAttempts, [email]);
        await client.query(dbOps.setToken, [email, token]);
        await client.query(dbOps.unBlockUser, [email]);
        user.token = token;
        return res.json(user);    
    } catch (err) {
       console.error(err.message);
    }
});

app.post("/getuser", async (req,res) => {
    try {
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.json(user);
        }
        const getDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
        return res.json(getDetails.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/seefriends", async (req,res) => {
    try {
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.json(user);
        }
        const getUserDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
        const getFriends = await client.query(dbOps.getFriends, [getUserDetails.rows[0]["id"]]); 
        return res.json(getFriends.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/sendrequest", async (req,res) => {
    try {
        const {email} = req.body;
        if(!(email)) {
            return res.json({  
                success: false,
                error: true,
                message: "Friend email required"
            })
        }
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.json(user);
        }

        // check if user exists         
        const userExists =  await client.query(dbOps.userExists, [email]);
        if(!userExists.rows[0]["exists"]) {
            return res.json({  
                success: false,
                error: true,
                message: `User with email ${email} not found. Send request to existing users`
            })                
        }

        const userDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
        const friendDetails = await client.query(dbOps.getUserDetails, [email]); 
        const userId:number = userDetails.rows[0]["id"];
        const friendId:number = friendDetails.rows[0]["id"];

        // check if there's a pending friend request is or user is already a friend.   
        const isFriend =  await client.query(dbOps.userIsFriend, [userId, friendId]);
        if(isFriend.rows[0]["is_friend"]) {
            return res.json({  
                success: false,
                error: true,
                message: `User with email ${email} is already a friend or a previous request is pending`
            })                
        }

        const sendRequest = await client.query(dbOps.sendFriendRequest, [userId, friendId]); 
        return res.json(sendRequest.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/acceptrequest", async (req,res) => {
    const {email} = req.body;
    if(!(email)) {
        return res.json({  
            success: false,
            error: true,
            message: "Friend email required to accept request"
        })
    }
    // check if user exists         
    const userExists =  await client.query(dbOps.userExists, [email]);
    if(!userExists.rows[0]["exists"]) {
        return res.json({  
            success: false,
            error: true,
            message: `User with email ${email} not found. Send request to existing users`
        })                
    }
    const user = isLoggedIn(req);
    if(!user.active) {           
        return res.json(user);
    }
    const userDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
    const friendDetails = await client.query(dbOps.getUserDetails, [email]); 
    const acceptRequest = await client.query(dbOps.acceptFriendRequest, [userDetails.rows[0]["id"], friendDetails.rows[0]["id"]]); 
    return res.json(acceptRequest.rows[0]);
});

export default app;