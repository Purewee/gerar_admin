# ------------------------------
# Builder stage
# ------------------------------
FROM node:22-alpine AS builder

# Enable Corepack for native pnpm support
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Copy package files, lockfile, and workspace/dependency configs
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Build the application for production
RUN pnpm run build

# ------------------------------
# Runtime stage (Nginx)
# ------------------------------
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Apply custom Nginx configuration (handles SPA fallback & gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]