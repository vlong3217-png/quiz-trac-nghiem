FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better cache layers
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
