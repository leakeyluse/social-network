import {config} from "dotenv";

config();
import jwt from 'jsonwebtoken';
const {jwtSecret, jwtExpiresIn} = process.env;

export const validatePassword = (password) => {
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

export const createToken = (email) => {
    return jwt.sign(
        {
            id: email
        },
        jwtSecret,
        {
            expiresIn: jwtExpiresIn
        }
    )
}

export const verifyToken = (token) => {
    try {
      return jwt.verify(token);
    } catch (err) {
      return null;
    }
};