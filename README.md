# Photo Contest App

A web application for hosting and participating in photo contests. Users can create contests, submit photos, and vote on submissions. Built with React, Node.js, and PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- AWS Account (for photo storage)
- Clerk Account (for authentication)

## Quick Start

1. Clone the repository:

   ```bash
   git clone git@github.com:ConnRaus/photo-contests.git
   cd photo-contests
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your:

   - Clerk authentication keys (from Clerk Dashboard)
   - AWS credentials and S3 bucket info
   - Database credentials (or leave default for local development)

3. Start the application:

   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - On your computer: http://localhost
   - On other devices on your network: http://YOUR_COMPUTER_IP
     (Find your IP with `ipconfig getifaddr en0` on Mac or `ipconfig` on Windows)

## Development

The application consists of three main components:

- Frontend (React + Vite)
- Backend (Node.js + Express)
- Database (PostgreSQL)

All services are containerized and managed through Docker Compose.

## Services

- **Frontend**: Serves the React application on port 80
- **Backend**: Handles API requests on port 3000
- **Database**: PostgreSQL instance (internal to Docker network)

## Local Network Access

To access the app from other devices on your local network:

1. Find your computer's IP address:

   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig` (look for IPv4 Address)

2. Access the app using your computer's IP:
   - Frontend: http://YOUR_COMPUTER_IP
   - Backend API: http://YOUR_COMPUTER_IP:3000

Note: Make sure your computer's firewall allows incoming connections on ports 80 and 3000.

## Troubleshooting

If you encounter issues:

1. Ensure all environment variables are set correctly in `.env`
2. Try rebuilding the containers: `docker-compose down && docker-compose up --build`
3. Check Docker logs: `docker-compose logs -f [service_name]`
4. For network access issues:
   - Check your firewall settings
   - Ensure you're using the correct IP address
   - Verify both devices are on the same network
