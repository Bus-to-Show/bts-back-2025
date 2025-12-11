require('dotenv').config();

/**
 * Centralized configuration module
 * Loads and exports all application configuration from environment variables
 */
const config = {
  // Application environment
  env: process.env.NODE_ENV || 'development',
  
  // Server port
  port: process.env.PORT || 3000,
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_KEY,
    expiresIn: '7d' // Default expiration
  },
  
  // Stripe payment configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  
  // Email configuration
  email: {
    service: 'gmail',
    user: 'updates@bustoshow.org',
    pass: process.env.EMAIL_PASS
  },
  
  // CORS configuration
  cors: {
    origins: process.env.ORIGIN_URL ? process.env.ORIGIN_URL.split(' ') : []
  },
  
  // Blocked email domains
  blockedDomains: process.env.BLOCKED_EMAIL_DOMAINS 
    ? process.env.BLOCKED_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase())
    : ['otvus.com'],
  
  // Cron job schedules
  cron: {
    cartSweep: '*/5 * * * *',      // Every 5 minutes
    reminderEmail: '15 17 * * *'   // Daily at 5:15 PM
  },
  
  // Ticketing app URL
  ticketingAppUrl: process.env.TICKETING_APP_URL || 'https://bus-to-show.github.io/bus-to-show-react'
};

module.exports = config;
