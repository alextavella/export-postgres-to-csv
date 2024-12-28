# Exporting high volume from Postgres to CSV

## Getting started

Create _.env_ file and update _DATABASE_URL_.

## Docker

```bash
docker-compose up -d --build
```

## Drizzle

### Applying changes to the database

```bash
npx drizzle-kit push
```

Read more about the push command in [documentation](https://orm.drizzle.team/docs/drizzle-kit-push).

### Generate migrations

```bash
npx drizzle-kit generate
```

### Apply migrations

```bash
npx drizzle-kit migrate
```

## Seed

```bash
pnpm seed
```

## Running

```bash
pnpm dev
```
