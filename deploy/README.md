# Deploying OptimalPost to VPS

This guide explains how to deploy OptimalPost to your VPS using Docker and Caddy for automatic HTTPS.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Domain name pointing to your VPS IP
- Google OAuth credentials

## 1. Setup Environment

Clone your repository to the VPS:
```bash
git clone <your-repo-url>
cd optimalpost
```

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` and fill in your actual values:
- `DATABASE_URL`: Set a secure password.
- `NEXTAUTH_URL`: Your full domain (e.g., `https://optimalpost.com`).
- `NEXTAUTH_SECRET`: Generate one with `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Your Google Cloud Console credentials.
- `OPENAI_API_KEY`: Your OpenAI API key.

## 2. Deploy with Docker

Start the application:
```bash
docker compose up -d --build
```

Wait for the database to be ready, then run the initial migration:
```bash
docker compose exec app npx prisma migrate deploy
```

## 3. Setup HTTPS (Optional but Recommended)

We use Caddy for easy HTTPS. 

Install Caddy on your VPS then create a `Caddyfile`:

```caddyfile
optimalpost.com {
    reverse_proxy localhost:3000
}
```

Then run:
```bash
caddy reload
```

## Maintenance

- **View logs**: `docker compose logs -f`
- **Update app**: `git pull && docker compose up -d --build`
- **Database Backup**: `docker compose exec postgres pg_dump -U optimalpost optimalpost > backup.sql`
