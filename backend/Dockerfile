# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Copy the .env file
COPY ../.env .env

# Expose port 3000
EXPOSE 3000

# Start the backend
CMD ["node", "server.js"]
