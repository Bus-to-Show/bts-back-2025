'use strict';

const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { user } = require('pg/lib/defaults');
const JWT_KEY = process.env.JWT_KEY
const whitelist = process.env.ORIGIN_URL.split(' ')
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool
const pool = new Pool(pgconfig);

router.get('/', function (req, res, next) {

//FORMAT OF TOKEN:
//Authorization: bearer <access token>
//verify token

  const user = req.user || {
    id: 1,
    userName: 'guest'
  }
  
  jwt.sign({user: user}, JWT_KEY, (err, token)=>{
    res.json({
      token: token
    })
  })
})

function verifyToken(req, res, next){
  console.log('------ original verify called ------', console.log(JSON.stringify(req.cookies["token"])))
  //get auth header value
  //const bearerHeader = req.headers['authorization']
  const cookieToken = req.cookies['token']
  //check if value exists
  if(cookieToken){
    //set to req.token
    req.token = cookieToken
    //call the Next Middleware
    next()

  } else {
    //forbidden
    res.sendStatus('403')
  }
}

router.get('/secure', async (req, res) => {
  (whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
      res.status(404).send('Not Found')
        }, 2000)
    :
  console.log('/secure hit ')
  const bearerHeader = req.headers.authorization;

  // Check if the authorization header exists
  if (!bearerHeader) {
    return res.status(401).send('Access denied');
  }

  // Extract the JWT from the authorization header
  const bearerToken = bearerHeader.split(' ')[1];

  // Verify the JWT using the secret key
  try {
    const decoded = await jwt.verify(bearerToken, JWT_KEY);
    console.log(decoded);
    const username = decoded.username
    pool.connect( async (err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      client.query(
      'SELECT  id, "firstName", "lastName", email, "hshPwd", "isWaiverSigned", "isStaff", "isDriver", "isAdmin", "isDeactivated", "preferredLocation" FROM users WHERE email = $1',
      [username]
      
      , async (err, result) => {
        release()
        if (err) {
          return console.error('Error executing query', err.stack)
        }
        const { rows } = result
      
        if (rows.length === 0) {
          return res.status(401).send('Invalid token!');
        }

        const user = rows[0];
        return res.status(200).send({
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          token: bearerToken
        });
      })
    })
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return console.error("Token has expired");
      } else {
        return console.error("Login token is invalid");
    }
  };
});



module.exports = {router, verifyToken};
