'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_KEY = process.env.JWT_KEY
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

  jwt.sign({ user: user }, JWT_KEY, (err, token) => {
    res.json({
      token: token
    })
  })
})

function verifyToken(req, res, next) {
  const cookieToken = req.cookies['token'];

  if (cookieToken) {
    jwt.verify(cookieToken, JWT_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
      }
      req.user = decoded; // Attach decoded token payload to req.user
      next();
    });
  }
  else {
    res.status(403).json({ message: 'Forbidden: No token provided' });
  }
}

router.get('/secure', async (req, res) => {
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
    pool.connect(async (err, client, release) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }
      client.query(
        'SELECT  id, "firstName", "lastName", email, "hshPwd", "isWaiverSigned", "isStaff", "isDriver", "isAdmin", "isDeactivated", "preferredLocation" FROM users WHERE email = $1',
        [username]

        , async (err, result) => {
          release()
          if (err) {
            console.error('Error executing query', err.stack)
            return res.status(500).send('Internal server error');
          }
          const { rows } = result

          if (rows.length === 0) {
            console.error('User not found');
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
  }
  catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token has expired");
      return res.status(401).send('Token has expired');
    }
    console.error("Login failed", error);
    return res.status(500).send('Login failed');
  };
});


module.exports = { router, verifyToken };
