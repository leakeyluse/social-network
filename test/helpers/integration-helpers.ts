import * as express from 'express';

// global, test users
var inDB = {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@test.com",
    password: "hash",
    token: "token"
}

var notInDB = {
    firstName: "Jane",
    lastName: "Doe",
    email: "janedoe@test.com",
    password: "p1Hhasg#2fverySTRo9",
    token: "token"
}

export const dummyUsers = {
    inDb: inDB,
    notInDb: notInDB
}