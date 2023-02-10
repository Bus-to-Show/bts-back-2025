'use strict';

const express = require('express');
const { password } = require('pg/lib/defaults.js');
const router = express.Router();
const knex = require('../knex.js')
const ORIGIN_URL = process.env.ORIGIN_URL
const JWT_KEY = process.env.JWT_KEY
const verifyToken = require('./api').verifyToken
const whitelist = process.env.ORIGIN_URL.split(' ')
const parse = require("pg-connection-string").parse;
const pgconfig = parse(process.env.DATABASE_URL);
pgconfig.ssl = { rejectUnauthorized: false };
const Pool = require('pg').Pool
const pool = new Pool(pgconfig);
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const sendRegistrationConfirmationEmail = require('../registrationEmails').sendEmailConfirmation


//List (get all of the resource)
router.get('/', verifyToken, function(req, res, next){
(whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
          res.sendStatus(404)
        }, 2000)
    :
  jwt.verify(req.token, JWT_KEY, (err, authData) => {
    if(err){
      res.sendStatus(403)
    } else {
      knex('users')
      .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'hshPwd', 'preferredLocation')
      .then((data) => {
        res.status(200).json(data)
      })
    }
  })
})

//Read (get one of the resource)
// Get One
router.get('/:id', verifyToken, function(req, res, next){
  jwt.verify(req.token, JWT_KEY, (err, authData) => {
    if(err){
      res.sendStatus(403)
    } else {
      knex('users')
      .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'hshPwd', 'preferredLocation')
      .where('id', req.params.id)
      .then((data) => {
        res.status(200).json(data[0])
      })
    }
  })
})

//Create (create one of the resource)
router.post('/', function(req, res, next){
          
  console.log('is this the register code? ')
  const payload = { username: req.body.email };
  // Sign the JWT using the secret key
  const token = jwt.sign(payload, JWT_KEY, { expiresIn: '72h' });
  const email = req.body.email;
  const password = req.body.hshPwd;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
    // returns hash
    req.body.hshPwd = hash.trim();
    });
  });
  return knex('users')
  .select('id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'preferredLocation')
  .where('email', email)
  .then((rows) =>{
    if(rows.length===0){
      return knex('users')
      .insert(req.body)
      .returning(['id', 'firstName', 'lastName', 'email', 'phone', 'isWaiverSigned', 'isStaff', 'isAdmin', 'isDriver', 'isDeactivated', 'preferredLocation'])
      .then( (data) => {
        console.log('we are ready to send that email', data)
        sendRegistrationConfirmationEmail(email, 'confirm', token);
        res.status(200).json({
          'message': 'email sent!',
          'code': '200',
          'email': `${email}`
        })
      }, (err) => {
        res.status(500).json({
          'message': 'email failed to send',
          'code': '500',
          'email': `${email}`
        });
      })
    } else {
      console.log('if email already exists', rows[0])
      res.status(200).json({
        'message': 'account already exists',
        'code': '202',
        'email': `${email}`
      }); 
    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
    next(err)
  })
})

router.post('/login/', async (req, res) => {
  (whitelist.indexOf(req.headers.origin) === -1)
  ?
  setTimeout(() => {
    res.sendStatus(404)
  }, 2000)
  :
  pool.connect( async (err, client, release) => {
    const {username, password} = req.body
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
        return res.status(401).send('Invalid username or password!');
      }
      // Check if the password is correct
      const user = rows[0];
      await bcrypt.compare(password, user.hshPwd.trim(), (err, result)=>{
        if(err) console.error(err)
        if (!result) {
          return res.status(401).send('Invalid username or password');
        } else {
          const payload = { username };
    
          // Sign the JWT using the secret key
          const token = jwt.sign(payload, JWT_KEY, { expiresIn: '14 days' });
    
          // Include the JWT in the user object
          // Return the user information
          return res.send({
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            token: token
          });
        }
      });
    })
  }) 
    
  });

  router.post('/send-reset', async (req, res)  => {
    (whitelist.indexOf(req.headers.origin) === -1)
    ?
    setTimeout(() => {
      res.sendStatus(404)
    }, 2000)
    :
    console.log('okay send-reset request is in!  ')
    const {username} = req.body
    const payload = { username };
    
          // Sign the JWT using the secret key
          const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });

          //check whether there is an account associated with the email address
          const query = 'SELECT email FROM users WHERE email = $1';
          pool.connect( async (err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack)
            } 
            client.query(
              query,
              [username]
              , async (err, results) => {
                release()
                if(err) {
                  console.error(err)
                  res.status(500).json({
                    'message': 'failed to determine account status',
                    'code': '500',
                    'email': `${username}`
                  });
                } else if (results && results.rows) {
                  console.log('password reset email match??? ', results.rows)
                  if(results.rows.length) {
                    sendRegistrationConfirmationEmail(username, 'reset', token);
                    res.status(200).json({
                      'message': 'password reset email sent',
                      'code': '200',
                      'email': `${username}`
                    })
                  } else {
                    res.status(200).json({
                      'message': 'no such account',
                      'code': '202',
                      'email': `${username}`
                    });
                  }
                }
              }
            )
            })


  })

  router.get('/confirm-email/:token/', async (req, res) => {
    const token = req.params.token;
    let username = ''
    try {
      const decoded = jwt.verify(token, JWT_KEY);
      console.log(decoded);
      username = decoded.username

      const query = 'UPDATE users SET is_verified = true WHERE email = $1';
      pool.connect( async (err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        } 
        client.query(
          query,
          [username]
          , async (err, results) => {
            release()
            if(err) {
              console.error(err)
              res.status(500).json({
                'message': 'failed to insert verified user',
                'code': '500',
                'email': `${username}`
              });
            } else {
  
              console.log('it worked! ', results );
              res.status(200).json({
                'message': 'success',
                'code': '200',
                'email': `${username}`
              });
            }
          }
        )
      })
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.error("Token has expired");
        res.status(200).json({
          'message': 'expired',
          'code': '203',
          'email': `${username}`
        });
      } else {
        console.error("confirm-email token is invalid", error);
        res.status(200).json({
          'message': 'invalid',
          'code': '203',
          'email': `${username}`
        });
      }
    }
   });


   router.post('/reset-pass/', async (req, res) => {
    const token = req.body.resetToken;
    const pass = req.body.hshPwd;
    let username = ''
    try {
      const decoded = jwt.verify(token, JWT_KEY);
      username = decoded.username
      const query = 'UPDATE users SET "hshPwd" = $2 WHERE email = $1';
      pool.connect( async (err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        } 
        client.query(
          query,
          [username, pass]
          , async (err, results) => {
            release()
            if(err) {
              console.error(err)
              res.status(500).json({
                'message': 'failed to insert verified user',
                'code': '500',
                'email': `${username}`
              });
            } else {
  
              console.log('it worked! ', results );
              res.status(200).json({
                'message': 'success',
                'code': '200',
                'email': `${username}`
              });
            }
          }
        )
      })
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.error("Token has expired");
        res.status(200).json({
          'message': 'expired',
          'code': '203',
          'email': `${username}`
        });
      } else {
        console.error("confirm-email token is invalid", error);
        res.status(200).json({
          'message': 'invalid',
          'code': '203',
          'email': `${username}`
        });
      }
    }
   });


module.exports = router;
