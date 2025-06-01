import express from 'express';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';

import {createToken, isBlocked, isLoggedIn, validatePassword} from "../auth/auth";
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
    return res.status(200).end(`Home to this very simple app.
        Paths: /login /signup /getuser{token} /seefriends{token} /sendrequest{email} /acceptrequest{email}`  
    );
});

app.post("/signup", async (req,res) => {
    try {
        const {firstName, lastName, email, password} = req.body;
        if(!(firstName && lastName && email && password)) {
            return res.status(400).json({  
                success: false,
                error: true,
                message: "Invalid data: firstName, lastname, email, password required"
            })
        }
        if(!validatePassword(password)) {
            return res.status(400).json({  
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
            return res.status(400).json({  
                success: false,
                error: true,
                message: `User with email ${email} exists. Use a different email or login instead`
            }) 
        }
        const signupUser = await client.query(dbOps.addUser, [firstName, lastName, email, passHash, token]);
        return res.status(200).json(signupUser.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/login", async (req,res) => {
    try {
        const {email, password} = req.body;

        if(!(email && password)) {
            return res.status(400).json({  
                success: false,
                error: true,
                message: "Invalid data: Email, password required"
            })
        }

        const userExists =  await client.query(dbOps.userExists, [email]);
        if(!userExists.rows[0]["exists"]) {
            return res.status(400).json({  
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
                return res.status(400).json({  
                    success: false,
                    error: true,
                    message: `Try again after ${(isBlockedToken.exp - Date.now()/1000)/60} minutes. Blocked for too many wrong login attempts`
                })
            }
            const blockToken:string = createToken(email);
            await client.query(dbOps.resetLoginAttempts, [email]);
            await client.query(dbOps.blockUser, [email, blockToken]);
            return res.status(400).json({  
                success: false,
                error: true,
                message: `Too many wrong login attempts. Blocked for 1hour`
            })
        }

        if(!await bcrypt.compare(password, user.passhash)) {
            await client.query(dbOps.updateLoginAttempts, [email]);
            return res.status(401).json({  
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
        return res.status(200).json(user);    
    } catch (err) {
       console.error(err.message);
    }
});

app.post("/getuser", async (req,res) => {
    try {
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.status(401).json(user);
        }
        const getDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
        return res.status(200).json(getDetails.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/seefriends", async (req,res) => {
    try {
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.status(401).json(user);
        }
        const getUserDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
        const getFriends = await client.query(dbOps.getFriends, [getUserDetails.rows[0]["id"]]); 
        return res.status(200).json(getFriends.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/sendrequest", async (req,res) => {
    try {
        const {email} = req.body;
        if(!(email)) {
            return res.status(400).json({  
                success: false,
                error: true,
                message: "Friend email required"
            })
        }
        const user = isLoggedIn(req);
        if(!user.active) {           
            return res.status(401).json(user);
        }

        // check if user exists         
        const userExists =  await client.query(dbOps.userExists, [email]);
        if(!userExists.rows[0]["exists"]) {
            return res.status(400).json({  
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
            return res.status(400).json({  
                success: false,
                error: true,
                message: `User with email ${email} is already a friend or a previous request is pending`
            })                
        }

        const sendRequest = await client.query(dbOps.sendFriendRequest, [userId, friendId]); 
        return res.status(200).json(sendRequest.rows[0]);
    }  catch (err) {
       console.error(err.message);
    }
});

app.post("/acceptrequest", async (req,res) => {
    const {email} = req.body;
    if(!(email)) {
        return res.status(400).json({  
            success: false,
            error: true,
            message: "Friend email required to accept request"
        })
    }
    // check if user exists         
    const userExists =  await client.query(dbOps.userExists, [email]);
    if(!userExists.rows[0]["exists"]) {
        return res.status(400).json({  
            success: false,
            error: true,
            message: `User with email ${email} not found. Send request to existing users`
        })                
    }
    const user = isLoggedIn(req);
    if(!user.active) {           
        return res.status(401).json(user);
    }
    const userDetails = await client.query(dbOps.getUserDetails, [user.data.email]); 
    const friendDetails = await client.query(dbOps.getUserDetails, [email]); 
    const acceptRequest = await client.query(dbOps.acceptFriendRequest, [userDetails.rows[0]["id"], friendDetails.rows[0]["id"]]); 
    return res.status(200).json(acceptRequest.rows[0]);
});

app.post("/suggest", async (req, res) => {
    try {
        // Authentication check
        const userMakingRequest = isLoggedIn(req);
        if (!userMakingRequest.active) {
            return res.status(401).json(userMakingRequest);
        }

        const { email } = req.body; // Email of the user for whom to get suggestions

        if (!email) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "User email is required in the request body."
            });
        }

        // 1. Get User A's details (especially ID)
        const userAResponse = await client.query(dbOps.getUserDetails, [email]);
        if (userAResponse.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: true,
                message: `User with email ${email} not found.`
            });
        }
        const userA = userAResponse.rows[0];
        const userAId = userA.id;

        // 2. Get User A's accepted friends
        const friendsOfAResponse = await client.query(dbOps.getAcceptedFriendsById, [userAId]);
        const friendsOfA = friendsOfAResponse.rows; // These are user objects
        const friendsOfAIds = new Set(friendsOfA.map(f => f.id));

        // 3. Get friends of friends
        const suggestedUsersMap = new Map(); // To store unique user objects {id, first_name, last_name, email}

        for (const friend of friendsOfA) {
            const friendsOfFriendResponse = await client.query(dbOps.getAcceptedFriendsById, [friend.id]);
            const friendsOfFriendList = friendsOfFriendResponse.rows;
            for (const fof of friendsOfFriendList) {
                // Add to map if not User A and not already a direct friend of User A
                if (fof.id !== userAId && !friendsOfAIds.has(fof.id)) {
                    if (!suggestedUsersMap.has(fof.id)) {
                         // Store essential details, not the whole db object if it contains sensitive info
                        suggestedUsersMap.set(fof.id, {
                            id: fof.id,
                            first_name: fof.first_name,
                            last_name: fof.last_name,
                            email: fof.email
                        });
                    }
                }
            }
        }

        const finalSuggestions = Array.from(suggestedUsersMap.values());

        return res.status(200).json({
            success: true,
            suggestions: finalSuggestions
        });

    } catch (err) {
        console.error("Error in /suggest endpoint:", err.message);
        // Check if err has a stack property before trying to access it
        const errorMessage = err.stack ? err.stack : err.message;
        return res.status(500).json({
            success: false,
            error: true,
            message: "Internal server error.",
            details: errorMessage // Optionally include more detail for debugging
        });
    }
});

export default app;