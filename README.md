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
   - Frontend: http://localhost
   - Backend API: http://localhost:3000

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

## Troubleshooting

If you encounter issues:

1. Ensure all environment variables are set correctly in `.env`
2. Try rebuilding the containers: `docker-compose down && docker-compose up --build`
3. Check Docker logs: `docker-compose logs -f [service_name]`
