# Social Network
Web server for a social network Using Typescript, Node.js, PostgreSQL. Use with Postman, Insomnia or curl.

# Installation 
```console
git clone 

# Add db connection details in .env
pgUser=username   
pgPassword=password
pgDb=database
pgHost=host
pgPort=port

# Add JWT config in .env
jwtSecret=jwtsecretkey   
jwtExpiresIn=jwtvalidityperiod

change server port in ./config/config.ts if necessary
  
# Install dependencies
npm install
```

# Testing
```
# Run all tests
npm test
```
# Usage with cURL
```
# start
npm start

server running on localhost:3000

# signup
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"firstName":"John","lastName":"doe","email":"john@doe.com","password":"#Hyour1_7password"}' \
http://localhost:3000/signup

# login
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"email":"john@doe.com","password":"#Hyour1_7password"}' \
http://localhost:3000/login

# get user (must be logged in, send your token with the request)
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"token":"john's_token"}' \
http://localhost:3000/getuser

# send friend request (must be logged in, send your token with the request)
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"email":"(Jane's Email) jane@doe.com","token":"john's_token"}' \
http://localhost:3000/sendrequest

# accept request (must be logged in, send your token with the request)
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"email":"(John's email) john@doe.com","token":"jane's_token"}' \
http://localhost:3000/acceptrequest

# see friends (must be logged in, send your token with the request)
curl \
--header "Content-Type: application/json" \
--request POST \
--data \
  '{"token":"john's_token/jane's_token"}' \
http://localhost:3000/seefriends
```

# Description: Routes
## a) Signup

1. Should collect and store a user's full name, email, and password.

2. You should record the timestamp of when the user signed up.

3. Should stop multiple users from signing up with the same email.

4. Secure the password details by encrypting them before saving them.

5. Check the signup request body for missing fields or incorrect fields.

6. Only people who enter strong passwords can sign up.

A strong password consists of at least six characters (and the more characters, the stronger the password) that are a combination of letters, numbers and symbols (@, #, $, %, etc.) if allowed. Passwords are typically case-sensitive, so a strong password contains letters in both uppercase and lowercase.

## b) Login

1. Return the correct error if a user enters the wrong information "User does not exist" or "Wrong password".

2. Return a timed JWT to allow a user to access locked routes.

3. *bonus* If a user tries to log in more than 5 times and fails, block them from trying for an hour.

## c) Get User

1. Only logged in users can access this route

2. Return the logged-in user details.

# *bonus routes*

## a) Send friend request

Add a route where a user can pass an email to send a friend request.

## b) Accept friend request

Add a route to allow a user to accept a friend request and create a friend connection.

## c) See Friends

Add a route that will return all of a user's friends.
