# Web Crawler - NSWI142

This is a repository for a team semestral work for the subject _Advanced Technologies for Web Applications_ (NSWI153).

You can find the assignment details and the documentation in our Github Wiki.

## Prerequisites

- set environment variables
    - `NEO4J_USER` - username for Neo4j database
    - `NEO4J_PASS` - password for Neo4j database
    - `RABBITMQ_USER` - username for RabbitMQ
    - `RABBITMQ_PASS` - password for RabbitMQ
    - `CRAWLER_WORKER_COUNT` - number of workers in the crawler
    - `MAX_HANDLED_REQUESTS_PER_CRAWL` - maximum number of handled requests per crawl
- see an example `.env` file [here](./.env.example)

## Usage

Docker compose is required to use this application.

```
git clone https://github.com/PatrikTrefil/web-crawler
docker compose up
```

## Development

-   to start dev server run `npm run dev` from the root of the repository
-   to build all projects run `npm run build` from the root of the repository

If you want to start a server or build a particular subproject, `cd /path/to/subproject`.
You can then run the same commands for the same actions.

If you want to run the development server inside Docker, use the following command:

```
docker compose -f docker-compose.yaml -f docker-compose.dev-override.yaml up
```
