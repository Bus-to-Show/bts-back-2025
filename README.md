# BTS API Backend

This repo defines the API used by the admin site and ticketing app.
It also defines cron jobs for regularly getting data from Ticketmaster,
removing stale carts, and sending reminder emails.

Production URL: https://blooming-fortress-13049.herokuapp.com/

Heroku dashboard: https://dashboard.heroku.com/apps/blooming-fortress-13049/

## Development

### Prerequisites

* Node v16.20
* npm v8.19
* One of:
  * PostgreSQL v16.8
  * Docker with Compose v2

### Setup/run

1. Install the dependencies with `npm install`

2. Create the database

   If you have Docker, just run `docker compose up`.
   Otherwise create the database in pgAdmin/DBeaver/whatever.

3. Create a file named `.env` in the project root directory with these contents:

   ```
   DATABASE_URL=postgres://[user]:[pass]@localhost:5432/[database]
   JWT_KEY=[jwt_key]
   ORIGIN_URL=http://localhost:4200 http://localhost:8080
   STRIPE_SECRET_KEY=[sk_test_key]
   TICKETING_APP_URL=https://bus-to-show.github.io/bus-to-show-react
   ```

   * Replace `[user]`, `[pass]`, and `[database]` with values from step 2
   * Replace `[jwt_key]` with anything
   * Replace `[sk_test_key]` with the value from Heroku or Stripe
     * Make sure to use the *test* key, not the *live* key!

   The origins correspond to the ticketing app and admin site respectively when
   running on localhost.

4. Create the database tables with `npx knex migrate:latest`

5. Populate the database tables with `npx knex seed:run`

6. Run the API with `npm start`

### Test

Run the unit tests with `npm test`. The test runner will pick up all files
whose basename starts with `test-` (e.g. `test-example.js`) or ends with
`test` (e.g. `example.test.js`, `example-test.js`).

### Deploy

Any push/merge to the main branch will be deployed to production automatically
via Heroku.
