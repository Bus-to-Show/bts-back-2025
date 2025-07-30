'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex.js')
const JWT_KEY = process.env.JWT_KEY
const verifyToken = require('./api').verifyToken
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);

const Pool = require('pg').Pool
const pool = new Pool(pgconfig);
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const sendRegistrationConfirmationEmail = require('../registrationEmails').sendEmailConfirmation

//List (get all of the resource)
router.get('/', verifyToken, (req, res) => {
  jwt.verify(req.token, JWT_KEY, (err, authData) => {
    if (err) {
      return res.status(403).json({message: 'This route is top secret.'});
    }

    knex('users')
      .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'hshPwd', 'preferredLocation')
      .then((data) => {
        return res.status(200).json(data)
      })
  })
})

//Read (get one of the resource)
// Get One
router.get('/:id', verifyToken, (req, res) => {
  jwt.verify(req.token, JWT_KEY, (err, authData) => {
    if (err) {
      return res.status(403).json({message: 'This route is top secret.'});
    }

    knex('users')
      .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'hshPwd', 'preferredLocation')
      .where('id', req.params.id)
      .then((data) => {
        return res.status(200).json(data[0])
      })
  })
})

//Create (create one of the resource)
router.post('/', (req, res) => {
  if (!req.body.hshPwd || !req.body.email) {
    return res.status(400).json({message: 'Email and password are required.'});
  }

  const payload = {username: req.body.email};

  // Sign the JWT using the secret key
  const token = jwt.sign(payload, JWT_KEY, {expiresIn: '72h'});
  const email = req.body.email;
  const password = req.body.hshPwd;
  let hshPass = ''

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing password', err);
      return res.status(500).json({message: 'An unknown error occurred.'});
    }

    // returns hash
    hshPass = hash.trim();
    req.body.hshPwd = hshPass;

    return knex('users')
      .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'preferredLocation')
      .where('email', email)
      .then((rows) => {
        if (rows.length === 0) {
          return knex('users')
            .insert(req.body)
            .returning(['id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'preferredLocation'])
            .then((data) => {
              sendRegistrationConfirmationEmail(email, 'confirm', token);

              return res.status(201).json({
                message: 'Verification email sent.',
                email,
              })
            })
        }

        if (req.body.resendEmail === true) {
          sendRegistrationConfirmationEmail(email, 'confirm', token);

          return res.status(200).json({
            message: 'Verification email resent.',
            email,
          })
        }

        return res.status(409).json({
          message: 'Account already exists.',
          email,
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({message: 'An unknown error occurred.'});
      })
  });
})

router.post('/login/', (req, res) => {
  if (!req.body.password || !req.body.username) {
    return res.status(400).json({message: 'Username and password are required.'});
  }

  pool.connect((err, client, release) => {
    const {username, password} = req.body

    if (err) {
      console.error('Error acquiring client', err);
      return res.status(500).json({message: 'An unknown error occurred.'});
    }

    client.query(
      `SELECT  id, "firstName", "lastName", email, "hshPwd", "isWaiverSigned", "isStaff", "isDriver", "isAdmin", "isDeactivated", "preferredLocation"
      FROM users
      WHERE email = $1
      AND is_verified = true`,
      [username],
      (err, result) => {
        release()

        if (err) {
          console.error('Error executing query', err);
          return res.status(500).json({message: 'An unknown error occurred.'});
        }

        const {rows} = result

        if (rows.length === 0) {
          return res.status(401).json({message: 'Invalid username or password.'});
        }

        // Check if the password is correct
        const user = rows[0];

        bcrypt.compare(password, user.hshPwd, (err, result) => {
          if (err) {
            console.error('Error comparing password', err);
            return res.status(500).json({message: 'An unknown error occurred.'});
          }

          if (!result) {
            return res.status(401).json({message: 'Invalid username or password.'});
          }

          const payload = {username};

          // Sign the JWT using the secret key
          const token = jwt.sign(payload, JWT_KEY, {expiresIn: '14 days'});

          // Include the JWT in the user object
          // Return the user information
          return res.status(200).json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
            token: token
          });
        });
      }
    )
  })
});

router.post('/send-reset', (req, res)  => {
  const {username} = req.body
  const payload = {username};

  // Sign the JWT using the secret key
  const token = jwt.sign(payload, JWT_KEY, {expiresIn: '1h'});

  //check whether there is an account associated with the email address
  const query = 'SELECT email FROM users WHERE email = $1';

  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error acquiring client', err);
      return res.status(500).json({message: 'An unknown error occurred.'});
    }

    client.query(
      query,
      [username],
      (err, results) => {
        release()

        if (err) {
          console.error('Error executing query', err);
          return res.status(500).json({message: 'An unknown error occurred.'});
        }

        if (results?.rows?.length) {
          sendRegistrationConfirmationEmail(username, 'reset', token);

          return res.status(200).json({
            message: 'Password reset email sent.',
            email: username,
          })
        }

        return res.status(404).json({
          message: 'No such account.',
          email: username,
        });
      }
    )
  })
})

router.get('/confirm-email/:token/', (req, res) => {
  const token = req.params.token;
  let username = ''

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    username = decoded.username

    const query = 'UPDATE users SET is_verified = true WHERE email = $1';

    pool.connect((err, client, release) => {
      if (err) {
        console.error('Error acquiring client', err);
        return res.status(500).json({message: 'An unknown error occurred.'});
      }

      client.query(
        query,
        [username],
        (err, results) => {
          release()

          if (err) {
            console.error('Error executing query', err);
            return res.status(500).json({message: 'An unknown error occurred.'});
          }

          return res.status(200).json({
            message: 'Account verified.',
            email: username,
          });
        }
      )
    })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const payload = jwt.verify(token, JWT_KEY, {ignoreExpiration: true});
      username = payload.username

      return res.status(400).json({
        message: 'Token has expired.',
        email: username,
      });
    }

    console.error(err);
    return res.status(500).json({message: 'An unknown error occurred.'});
  }
});

router.post('/reset-pass/', (req, res) => {
  const token = req.body.resetToken;
  let username = ''
  const password = req.body.hshPwd

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing password', err);
      return res.status(500).json({message: 'An unknown error occurred.'});
    }

    // returns hash
    req.body.hshPwd = hash;
    const pass = req.body.hshPwd;

    try {
      const decoded = jwt.verify(token, JWT_KEY);
      username = decoded.username
      const query = 'UPDATE users SET "hshPwd" = $2 WHERE email = $1';

      pool.connect((err, client, release) => {
        if (err) {
          console.error('Error acquiring client', err);
          return res.status(500).json({message: 'An unknown error occurred.'});
        }

        client.query(
          query,
          [username, pass],
          (err, results) => {
            release()

            if (err) {
              console.error('Error executing query', err);
              return res.status(500).json({message: 'An unknown error occurred.'});
            }

            return res.status(200).json({
              message: 'Password updated.',
              email: username,
            });
          }
        )
      })
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        const payload = jwt.verify(token, JWT_KEY, {ignoreExpiration: true});
        username = payload.username

        return res.status(400).json({
          message: 'Token has expired.',
          email: username,
        });
      }

      console.error(err);
      return res.status(500).json({message: 'An unknown error occurred.'});
    }
  });
});

module.exports = router;
