// Frontend Configuration for Globeflight
// Environment variables for production

const config = {
  development: {
    VITE_API_URL: 'http://localhost:5000/api',
    VITE_EMAIL_API_ENDPOINT: 'http://localhost:5000/email-api'
  },
  production: {
    VITE_API_URL: 'https://globeflight.co.ke/api',
    VITE_EMAIL_API_ENDPOINT: 'https://globeflight.co.ke/email-api'
  }
};

/*
To use these settings, create the following environment files:

1. .env.development (for local development):
VITE_API_URL=http://localhost:5000/api
VITE_EMAIL_API_ENDPOINT=http://localhost:5000/email-api

2. .env.production (for production):
VITE_API_URL=https://globeflight.co.ke/api
VITE_EMAIL_API_ENDPOINT=https://globeflight.co.ke/email-api

3. .env.local (for local overrides):
VITE_API_URL=http://localhost:5000/api
VITE_EMAIL_API_ENDPOINT=http://localhost:5000/email-api
*/

module.exports = config; 