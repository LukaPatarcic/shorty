FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml ./

# Copy all package.json files first for better caching
COPY shared/package.json ./shared/
COPY shorten-service/package.json ./shorten-service/
COPY redirect-service/package.json ./redirect-service/
COPY analytics-service/package.json ./analytics-service/
COPY shorty-www/package.json ./shorty-www/
# Copy shared package source
COPY shared ./shared

# Install and build shared package
RUN pnpm install --filter shared
RUN cd shared && pnpm build

# Install all dependencies including dev dependencies
RUN pnpm install

# Copy service source files
COPY shorten-service ./shorten-service
COPY redirect-service ./redirect-service
COPY analytics-service ./analytics-service
COPY shorty-www ./shorty-www

# Build stage
FROM base AS build
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Final stage
FROM node:20-alpine
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Install pnpm in the final stage
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

WORKDIR /app

# Copy workspace files and shared package
COPY package.json pnpm-workspace.yaml ./
COPY --from=build /app/shared ./shared

# Copy the service and node_modules
COPY --from=build /app/${SERVICE_NAME} ./${SERVICE_NAME}
COPY --from=build /app/node_modules ./node_modules

# Set the working directory to the service directory
WORKDIR /app/${SERVICE_NAME}

# Start the service
CMD ["pnpm", "dev"] 