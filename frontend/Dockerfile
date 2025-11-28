# Stage 1: Build the Vite app
FROM node:22-alpine AS builder

WORKDIR /app

# Add build arguments for Vite environment variables
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install 

# Copy source code
COPY . .

# Set the environment variables for the build
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
ENV VITE_API_URL=${VITE_API_URL}

# Build the Vite app using the special docker-build script
RUN npm run docker-build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config with HTTP, HTTPS, and API proxy support
RUN echo 'server { \
    listen 80; \
    listen 443 ssl; \
    ssl_certificate /etc/nginx/certs/cert.pem; \
    ssl_certificate_key /etc/nginx/certs/key.pem; \
    ssl_protocols TLSv1.2 TLSv1.3; \
    ssl_ciphers HIGH:!aNULL:!MD5; \
    \
    # Allow large file uploads (50MB) \
    client_max_body_size 50M; \
    \
    # Proxy API requests to backend \
    location /api/ { \
        proxy_pass http://backend:3000/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        client_max_body_size 50M; \
    } \
    \
    # Serve frontend static files \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose ports 80 and 443
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
