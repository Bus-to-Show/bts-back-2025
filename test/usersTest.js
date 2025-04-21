require('dotenv').config(); // Load environment variables from .env
const http = require('http'); // Use http for local development
const knex = require('../knex'); // Import knex for database setup
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for JWT generation

// Setup test data in the database
async function setupTestData() {
  console.log('Checking and setting up test data...');

  // Check if the admin user exists
  let adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    console.log('Admin user not found. Creating admin user...');
    const [adminId] = await knex('users').insert({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      hshPwd: 'hashedpassword1', // Replace with a hashed password if needed
      isAdmin: true,
      is_verified: true,
    }).returning('id');
    adminUser = { id: adminId };
  } else {
    console.log('Admin user already exists.');
  }

  // Check if the regular user exists
  let regularUser = await knex('users').where({ email: 'user@example.com' }).first();
  if (!regularUser) {
    console.log('Regular user not found. Creating regular user...');
    const [regularId] = await knex('users').insert({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@example.com',
      hshPwd: 'hashedpassword2', // Replace with a hashed password if needed
      isAdmin: false,
      is_verified: true,
    }).returning('id');
    regularUser = { id: regularId };
  } else {
    console.log('Regular user already exists.');
  }

  // Generate JWT tokens
  const adminToken = jwt.sign(
    { id: adminUser.id, role: 'admin' },
    process.env.JWT_KEY,
    { expiresIn: '1h' }
  );

  const userToken = jwt.sign(
    { id: regularUser.id, role: 'user' },
    process.env.JWT_KEY,
    { expiresIn: '1h' }
  );

  return { adminUser, regularUser, adminToken, userToken };
}

// Define the test function
function testGetUserById(userId, token, expectedStatusCode, expectedMessage) {
  const options = {
    hostname: 'localhost',
    port: process.env.SERVER_PORT || 3000,
    path: `/users/${userId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Origin': 'http://localhost:4200',
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    // Collect response data
    res.on('data', (chunk) => {
      data += chunk;
    });

    // Handle the end of the response
    res.on('end', () => {
      console.log(`Test for User ID: ${userId}`);
      console.log(`Expected Status Code: ${expectedStatusCode}, Actual Status Code: ${res.statusCode}`);
      console.log(`Response: ${data}`);

      // Verify the status code
      if (res.statusCode === expectedStatusCode) {
        console.log('Test Passed: Status code matches expected.');
      } else {
        console.log('Test Failed: Status code does not match expected.');
      }

      // Verify the response message (if applicable)
      if (expectedMessage && data.includes(expectedMessage)) {
        console.log('Test Passed: Response message matches expected.');
      } else if (expectedMessage) {
        console.log('Test Failed: Response message does not match expected.');
      }
      console.log('-----------------------------------');
    });
  });

  // Handle request errors
  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
}

// Run the tests
(async () => {
  console.log('Setting up test data...');
  const { adminUser, regularUser, adminToken, userToken } = await setupTestData();

  // Test 1: Admin accessing a valid user
  console.log('Test 1: Admin accessing a valid user');
  testGetUserById(adminUser.id, adminToken, 200, `"id":${adminUser.id}`);

  // Test 2: User accessing their own data
  console.log('Test 2: User accessing their own data');
  testGetUserById(regularUser.id, userToken, 200, `"id":${regularUser.id}`);

  // Test 3: User accessing another user's data
  console.log('Test 3: User accessing another user\'s data');
  testGetUserById(adminUser.id, userToken, 403, 'Forbidden: Access denied');

  // Test 4: Invalid token
  console.log('Test 4: Invalid token');
  testGetUserById(adminUser.id, 'invalid-token', 403, 'Forbidden: Invalid token');

  // Test 5: Non-existent user
  console.log('Test 5: Non-existent user');
  testGetUserById(999, adminToken, 404, 'User not found');
})();
