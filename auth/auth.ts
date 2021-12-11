import {config} from "dotenv";

config();
import jwt from 'jsonwebtoken';
const {jwtSecret, jwtExpiresIn} = process.env;

interface JwtPayload {
    email: string
}

export const validatePassword = (password:string):boolean => {
    /*
     * password has at least:
           (?=.*[A-Z])       1 uppercase letter
           (?=.*[!@#$&*])    1 special character
           (?=.*[0-9])       1 digit
           (?=.*[a-z])       1 lowercase letter
           .{8, 20}          length between 8 and 20 chars
     *
     */
    const re = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*])[a-zA-Z0-9!@#$&*].{8,20}$/;
    return re.test(password);
};

export const createToken = (email:string) => {
    return jwt.sign(
        {
            email: email
        },
        jwtSecret,
        {
            expiresIn: jwtExpiresIn
        }
    )
}

export const verifyToken = (token:string) => {
    try {
        return jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (err) {
        return null;
    }
};

export const isBlocked = (token:string) => {
    try {
        if(jwt.verify(token, jwtSecret))
            return true;
        return false;
    } catch (err) {
        return null;
    }
};