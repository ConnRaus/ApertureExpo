# Stage 1: Build the Vite app
FROM node:18.17-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Copy the .env file
COPY ../.env .env

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
