const { AppError } = require('../utils/errors.js');
const config = require('../config/index.js');

/**
 * Centralized error handling middleware
 * Handles all errors thrown in the application and returns consistent JSON responses
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'An unknown error occurred.';
  let isOperational = false;
  
  // Handle AppError and its subclasses
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }
  // Handle Knex database errors
  else if (err.name === 'KnexTimeoutError') {
    statusCode = 503;
    message = 'Database connection timeout';
  }
  else if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }
  else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }
  else if (err.code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field is missing';
  }
  // Handle validation errors from other sources
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Use error message if available
  else if (err.message) {
    message = err.message;
  }
  
  // Log error details
  if (config.env === 'development' || !isOperational) {
    console.error('Error:', {
      message: err.message,
      statusCode,
      stack: err.stack,
      isOperational
    });
  } else {
    console.error('Error:', {
      message: err.message,
      statusCode
    });
  }
  
  // Build response object
  const response = {
    success: false,
    message
  };
  
  // Include stack trace in development mode
  if (config.env === 'development') {
    response.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 * Handles requests to routes that don't exist
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'That page does not exist.'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
