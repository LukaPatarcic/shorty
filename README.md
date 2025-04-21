# Shorty - URL Shortener

Shorty is a modern, scalable URL shortening service built with a microservices architecture. It provides URL shortening, redirection, and analytics capabilities.

## 🚀 Features

- URL shortening with custom aliases
- Fast URL redirection
- Real-time analytics
- Distributed architecture with multiple services
- Monitoring and observability with Datadog
- Message queue system with Kafka
- Caching with Redis
- Data persistence with PostgreSQL
- Analytics storage with Elasticsearch
- Beautiful UI for monitoring with Kibana and Kafka UI

## 🏗 Architecture

The project consists of three main microservices:

1. **Shorten Service** (Port 3000)

   - Handles URL shortening requests
   - Manages URL mappings in PostgreSQL
   - Produces events to Kafka

2. **Redirect Service** (Port 3001)

   - Handles URL redirection
   - Uses Redis for caching
   - Consumes events from Kafka

3. **Analytics Service** (Port 3002)
   - Processes and stores analytics data
   - Uses Elasticsearch for data storage
   - Consumes events from Kafka

## 🛠 Prerequisites

- Docker and Docker Compose
- Node.js (v18 or higher recommended)
- pnpm package manager

## 🚦 Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd shorty
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create `.env` files in each service directory by copying .env.template:

   - `root/.env`
   - `shorten-service/.env`
   - `redirect-service/.env`
   - `analytics-service/.env`

4. Start the services:

   ```bash
   docker-compose up -d
   ```

## 🔌 Service Endpoints

- Shorten Service: http://localhost:3000
- Redirect Service: http://localhost:3001
- Analytics Service: http://localhost:3002
- Kafka UI: http://localhost:8080
- Kibana: http://localhost:5601
- Elasticsearch: http://localhost:9200

## 📊 Monitoring

The project uses Datadog for monitoring and observability. The Datadog agent is configured to collect:

- Application metrics
- Container logs
- APM traces
- PostgreSQL metrics

Make sure to set up your Datadog API key in the docker-compose.yml file.

## 💾 Data Persistence

- PostgreSQL data: Stored in `postgres_data` volume
- Redis data: Stored in `redis_data` volume
- Elasticsearch data: Stored in `elasticsearch-data` volume
- Kafka data: Stored in `kafka_data` volume
- Zookeeper data: Stored in `zookeeper_data` and `zookeeper_log` volumes

## 🛠 Development

The project uses pnpm workspaces for managing multiple packages. Common code is shared through the `shared` directory.

To build all services:

```bash
pnpm build
```

To run all services in development mode:

```bash
pnpm dev
```

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
