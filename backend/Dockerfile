# backend/Dockerfile
# Stage 1: Build the app
FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the backend using npm start
CMD ["npm", "start"]
