FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Run the app in development mode
CMD ["pnpm", "dev"] 