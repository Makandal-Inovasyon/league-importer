# Backend [Technical challenge](./Backend%20Test%20-%20Node.js.pdf)

## Project structure

The project is composed of:

- A graphQL API built with **Nest** and written in **Typescript**
- The data is saved in a **PostgreSQL** database
- a **Redis** instance is used for caching
- **SQS** with **localstack** for a message queue

The graphQL API exposes a mutation **importLeague** that accept `leagueCode` as a parameter and a subscription that informs the status of the league importation process.
A code first approach is used to build the graphQL api. The schema is managed by the `@nestjs/graphql` library.

For all requests to import a league, first it checks if the competition has not already been imported or updated in the last 24 hours. If so, a status of Done is returned, otherwise it produces a message to the queue and a Pending status is returned immediatly.

The actual import process is done by a consumer that reads the messages from the queue. This handler retrieves the leagueCode,
checks the redis cache if the rate limit to request the remote API has not been exceeded. If it has, nothing is done. The message is not acknowledged and is not removed from the queue, leaving it to be retried at a later time. To import the data two GET requests are made to the remote API with the configured token. The first to retrieve the Competition and right after, a second to import the teams and corresponding players. After the import process is done the satus isupdated and published.

The queries are fulfilled by directly consulting the database.

When adding the retrieved data to the database, an upsert is made using the received id as Primary Key to avoid duplicating existind data.
The database schema is managed transparently by the **TypeORM** library.

Redis is used with the `ioredis` library to cache the number of hits remaining. This project use the `slide-limiter` library to keep track of the hits over time.
That way we manage not cross the frecuency limit imposed by the API.

## Framework and libraries

- [Nest](https://github.com/nestjs/nest) Typescript framework

- [TypeORM](https://typeorm.io/)
- [@nestjs/graphql](https://www.npmjs.com/package/@nestjs/graphql)
- [axios](https://axios-http.com/)
- [@ssut/nestjs-sqs](https://www.npmjs.com/package/@ssut/nestjs-sqs)
- [ioredis](https://www.npmjs.com/package/ioredis)
- [slide-limiter](https://github.com/m-elbably/slide-limiter)

## Requirements to run the project

- docker and docker compose
- All required configuration is done with environment variables in the `.env` file, except the `FOOT_BALL_API_TOKEN` that must be set
  in shell before runing the project.

## Installing and Running locally

```bash
# clone the repo and run the following
$ docker compose up
# or
$ docker compose up -d

```

after all the images have been built and and containers are running, navigate to [http://localhost:3000/graphql](http://localhost:3000/graphql)

> NOTE
> : This project is purposefully over engineered. For example the redis could be used for both caching and pubSub or a queuing mechanism eleminating the need for localstack, but the goal is to showcase my skills and some tools with which I am familiar.
