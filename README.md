# Aperture Expo

A web application for hosting and participating in photo contests. Users can create contests, submit photos, and vote on submissions. Built with React, Node.js, and PostgreSQL.

## Prerequisites

Before you begin, you'll need:

1. **Docker and Docker Compose**

   - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - This handles all database and service setup

2. **Clerk Account (Authentication)**

   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Get your API keys from the Clerk Dashboard

3. **AWS Account (Photo Storage)**
   - Sign up for [AWS](https://aws.amazon.com)
   - Create an S3 bucket for photo storage
   - Create an IAM user with S3 access
   - Get your AWS credentials

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone git@github.com:ConnRaus/PhotoContests.git
   cd PhotoContests
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your:

   - Clerk API keys
   - AWS credentials
   - The database settings can be left as default for local development

3. **Configure AWS S3:**

   - Create a new S3 bucket
   - Enable public access (for photo URLs)
   - Add a CORS configuration in your S3 bucket:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": []
       }
     ]
     ```

4. **Configure Clerk:**

   - In your Clerk Dashboard:
     - Add `http://localhost` to your allowed origins
     - Add `http://localhost:3000` to your allowed origins
     - Configure sign-in/sign-up methods as desired

5. **Start the application:**

   ```bash
   docker-compose up --build
   ```

   This will:

   - Create a PostgreSQL database
   - Set up all necessary tables
   - Start the backend server
   - Start the frontend application

6. **Access the application:**
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:3000](http://localhost:3000)

## Development Notes

### Database Management

- The database is automatically created and managed by Docker
- Tables are created/updated using Sequelize models
- Data persists between container restarts in the `pgdata` volume
- To reset the database:
  ```bash
  docker-compose down -v  # Removes volumes
  docker-compose up --build
  ```

### Database Commands

For managing contest data:

```bash
# Delete all existing contests
docker compose exec db psql -U photo_contest_admin -d photo_contest_db -c "DELETE FROM \"Contests\";"

# Run the seed script to create test contests
docker compose exec backend node database/seeders/testContests.js

# View all contests (basic info)
docker compose exec db psql -U photo_contest_admin -d photo_contest_db -c "SELECT id, title, status FROM \"Contests\";"

# View a specific contest details
docker compose exec db psql -U photo_contest_admin -d photo_contest_db -c "SELECT * FROM \"Contests\" WHERE id = 'contest-id-here';"

# Delete a specific contest by ID
docker compose exec db psql -U photo_contest_admin -d photo_contest_db -c "DELETE FROM \"Contests\" WHERE id = 'contest-id-here';"
```

These commands can be useful for:

- Resetting just the contest data without affecting other tables
- Testing different contest scenarios with the pre-configured test contests
- Setting up demo data quickly
- Inspecting or modifying specific contests in the database

### Seeding Test Data

To seed the database with test contests of various durations (past, active, upcoming):

```bash
docker-compose exec backend npm run seed-test-contests
```

This will create:

- Past contests (already ended)
- Active contests with different durations (12 hours, 1 hour, 1 minute)
- Upcoming contests (starting soon and in the future)

### Photo Metadata

The application now extracts and stores EXIF metadata from uploaded photos, which can be viewed by clicking on a photo and checking the browser console.

### Environment Variables

The `.env` file contains sensitive information and should never be committed. Instead:

- Use `.env.example` as a template
- Each developer creates their own `.env` file
- Get your own API keys for services (Clerk, AWS)

### Local Network Access

To access the app from other devices on your network:

1. Find your computer's IP:

   ```bash
   # On Mac
   ipconfig getifaddr en0

   # On Windows
   ipconfig  # Look for IPv4 Address
   ```

2. Update your `.env`:

   ```
   VITE_API_URL=http://YOUR_IP:3000
   CORS_ORIGINS=http://localhost,http://localhost:80,http://YOUR_IP,http://YOUR_IP:80
   ```

3. Restart the containers:
   ```bash
   docker-compose down && docker-compose up --build
   ```

## Feature Overview

- **User Authentication**: Sign up and sign in using Clerk
- **Photo Contests**: Browse active, upcoming, and past contests
- **Photo Uploads**: Submit photos to contests with titles and descriptions
- **Photo Gallery**: View photos submitted by all users
- **User Profiles**: View your own profile and profiles of other users
- **Contest Timeline**: Contests automatically change status based on start/end dates with countdown timers

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**

   - Ensure Docker is running
   - Check if the database container is up: `docker-compose ps`
   - View database logs: `docker-compose logs db`

2. **Photo Upload Issues:**

   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure CORS is configured in S3

3. **Authentication Issues:**

   - Verify Clerk API keys
   - Check Clerk dashboard for allowed origins
   - Clear browser cache/cookies

4. **Network Access Issues:**
   - Check firewall settings
   - Verify IP address in `.env`
   - Ensure devices are on the same network

### Resetting Everything

If you need a fresh start:

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Rebuild and start
docker-compose up --build
```
