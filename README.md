# BTS API Backend

This repo defines the API used by the admin and rider sites.

It also defines cron jobs for regularly getting data from Ticketmaster,
removing stale carts, and sending reminder emails.

Production URL: https://blooming-fortress-13049.herokuapp.com/

Heroku dashboard: https://dashboard.heroku.com/apps/blooming-fortress-13049/

## Development

### Prerequisites

* Node v16.20
* npm v8.19
* One of:
    a. PostgreSQL v16.8
    b. Docker with Compose v2

### Setup

1. Install the dependencies with `npm install`

2. Create the database

   a. Using pgAdmin/DBeaver/whatever
   b. Using `docker compose up`

3. Create a file named `.env` in the project root directory with these contents:

   ```
   DATABASE_URL=postgres://[user]:[pass]@localhost:5432/[database]
   JWT_KEY=supersecret
   ORIGIN_URL=http://localhost:4200 http://localhost:8080
   ```

   Replace the stuff in brackets with values from step 2.
   Port 4200 is used by the rider site when running on localhost.
   Port 8080 is used by the admin site.

4. Create the database tables with `npx knex migrate:latest`

5. Populate the database tables with `npx knex seed:run`

6. Run the API with `npm start`
