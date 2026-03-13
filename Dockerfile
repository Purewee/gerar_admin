# ------------------------------
# Builder stage
# ------------------------------
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files AND lockfile
COPY package*.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build the app
RUN npm run build

# ------------------------------
# Runtime stage
# ------------------------------
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Only copy the build output from the builder
COPY --from=builder /app/dist ./dist

# Optional: copy package.json if you want to run scripts
COPY --from=builder /app/package*.json ./

# Install a minimal server for static files (serve)
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]