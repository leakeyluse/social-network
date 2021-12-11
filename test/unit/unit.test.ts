import bcrypt from 'bcryptjs';
import {createToken ,verifyToken, validatePassword} from "../../auth/auth";
import {dummyUsers} from "../helpers/integration-helpers";

describe('input pre-processing test', () => {  
    it('can validate password strength', () => {
        let result:boolean;

        var {password} = dummyUsers.inDb;
        result = validatePassword(password);
        expect(result).toBe(false);

        var {password} = dummyUsers.notInDb;
        result = validatePassword(password);
        expect(result).toBe(true);
    }); 
});

describe('authorization test', () => {  
    it('can encrypt password', async() => {
        const {password} = dummyUsers.inDb;
        const hash:string = await bcrypt.hash(password, 10);
        expect(password === hash).toBe(false);
    });  
    it('can verify password', async() => {
        const {password} = dummyUsers.inDb;
        const hash:string = await bcrypt.hash(password, 10);
        const compare = await bcrypt.compare(password, hash);
        expect(compare).toBe(true);
    });
});

describe('authentication test', () => {  
    it('can generate jwt', () => {
        const {email} = dummyUsers.inDb;
        const token:string = createToken(email);
        const emailFromPayload:string = verifyToken(token).email;
        expect(emailFromPayload).toBe(email);
    });  
    it('can decode jwt', () => {
        const {email} = dummyUsers.inDb;
        const token:string = createToken(email);
        const decoded = verifyToken(token);
        expect(decoded.email).toBe(email);
    });
});