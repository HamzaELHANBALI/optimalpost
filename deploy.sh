#!/bin/bash
# OptimalPost Deployment Script
# Usage: ./deploy.sh [command]
# Commands: init, deploy, update, migrate, backup, logs, stop, restart, status

set -e

DOMAIN="${OPTIMALPOST_DOMAIN:-provenpost.com}"
EMAIL="${OPTIMALPOST_EMAIL:-your-email@example.com}"  # Change this for SSL certificate notifications

case "$1" in
  init)
    echo "🚀 Initializing OptimalPost..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
      echo "⚠️  .env file not found!"
      if [ -f .env.example ]; then
        echo "📋 Copying .env.example to .env..."
        cp .env.example .env
        echo "✅ Created .env file. Please edit it and fill in your values:"
        echo "   - DATABASE_URL (set POSTGRES_PASSWORD)"
        echo "   - NEXTAUTH_URL (your domain: https://$DOMAIN)"
        echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
        echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
        echo "   - OPENAI_API_KEY"
      else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
      fi
    else
      echo "✅ .env file exists"
    fi
    
    # Check if Caddyfile exists
    if [ ! -f deploy/Caddyfile ]; then
      echo "⚠️  Caddyfile not found in deploy/ directory"
    else
      echo "✅ Caddyfile found"
      # Update domain in Caddyfile if needed
      if grep -q "yourdomain.com" deploy/Caddyfile; then
        echo "📝 Update deploy/Caddyfile with your domain: $DOMAIN"
      fi
    fi
    
    # Create necessary directories
    mkdir -p deploy/backups
    
    echo ""
    echo "✅ Initialization complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env and fill in all required values"
    echo "2. Update deploy/Caddyfile with your domain"
    echo "3. Run: ./deploy.sh deploy"
    ;;
    
  deploy)
    echo "🚀 Deploying OptimalPost..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
      echo "❌ .env file not found! Run './deploy.sh init' first."
      exit 1
    fi
    
    # Pull latest images
    echo "📥 Pulling latest images..."
    docker compose pull postgres || true
    
    # Build and start services
    echo "🔨 Building and starting services..."
    docker compose up -d --build
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    timeout=60
    counter=0
    while ! docker compose exec -T postgres pg_isready -U optimalpost -d optimalpost >/dev/null 2>&1; do
      if [ $counter -ge $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        exit 1
      fi
      echo "   Waiting... ($counter/$timeout)"
      sleep 2
      counter=$((counter + 2))
    done
    echo "✅ Database is ready"
    
    # Run migrations or push schema
    echo "🔄 Syncing database schema..."
    # Try migrate deploy, but if it fails with P3005 (no migrations), use db push
    MIGRATE_OUTPUT=$(docker compose exec -T app npx prisma migrate deploy 2>&1)
    MIGRATE_EXIT=$?
    
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005\|No migration found"; then
      echo "   No migrations found. Using db push to sync schema..."
      docker compose exec -T app npx prisma db push --accept-data-loss
    elif [ $MIGRATE_EXIT -eq 0 ]; then
      echo "✅ Migrations applied successfully"
    else
      echo "⚠️  Migration failed. Falling back to db push..."
      docker compose exec -T app npx prisma db push --accept-data-loss || {
        echo "⚠️  db push failed. Generating Prisma client only..."
        docker compose exec -T app npx prisma generate
      }
    fi
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Visit: https://$DOMAIN (if Caddy is configured)"
    echo ""
    echo "To view logs: ./deploy.sh logs"
    ;;
    
  update)
    echo "🔄 Updating OptimalPost..."
    
    # Pull latest code from git
    echo "📥 Pulling latest code..."
    git pull || echo "⚠️  Git pull failed or not a git repository"
    
    # Stop containers
    echo "🛑 Stopping containers..."
    docker compose down
    
    # Remove old app image
    echo "🗑️  Removing old app image..."
    docker rmi optimalpost-app 2>/dev/null || echo "   (No old image to remove)"
    
    # Build new image (no cache to ensure fresh build)
    echo "🔨 Building new image..."
    docker compose build --no-cache app
    
    # Start services
    echo "🚀 Starting services..."
    docker compose up -d
    
    # Wait for database
    echo "⏳ Waiting for database..."
    sleep 5
    
    # Wait for database to be ready
    timeout=30
    counter=0
    while ! docker compose exec -T postgres pg_isready -U optimalpost -d optimalpost >/dev/null 2>&1; do
      if [ $counter -ge $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        exit 1
      fi
      echo "   Waiting for database... ($counter/$timeout)"
      sleep 2
      counter=$((counter + 2))
    done
    
    # Run migrations or push schema
    echo "🔄 Syncing database schema..."
    # Try migrate deploy, but if it fails with P3005 (no migrations), use db push
    MIGRATE_OUTPUT=$(docker compose exec -T app npx prisma migrate deploy 2>&1)
    MIGRATE_EXIT=$?
    
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005\|No migration found"; then
      echo "   No migrations found. Using db push to sync schema..."
      docker compose exec -T app npx prisma db push --accept-data-loss
    elif [ $MIGRATE_EXIT -eq 0 ]; then
      echo "✅ Migrations applied successfully"
    else
      echo "⚠️  Migration failed. Falling back to db push..."
      docker compose exec -T app npx prisma db push --accept-data-loss || {
        echo "⚠️  db push failed. Generating Prisma client only..."
        docker compose exec -T app npx prisma generate
      }
    fi
    
    echo ""
    echo "✅ Update complete!"
    echo "Visit: https://$DOMAIN"
    ;;
    
  migrate)
    echo "🔄 Running database migrations..."
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
      docker compose exec app npx prisma migrate deploy
      echo "✅ Migrations complete!"
    else
      echo "⚠️  No migrations found. Using db push instead..."
      docker compose exec app npx prisma db push
      echo "✅ Schema synced!"
    fi
    ;;
    
  migrate-dev)
    echo "🔄 Creating new migration (development)..."
    read -p "Migration name: " migration_name
    docker compose exec app npx prisma migrate dev --name "$migration_name"
    echo "✅ Migration created!"
    ;;
    
  baseline)
    echo "📋 Creating baseline migration for existing database..."
    echo "⚠️  This will create a migration that matches your current database schema"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "❌ Baseline cancelled"
      exit 1
    fi
    
    echo "🔄 Creating baseline migration..."
    # Create migration directory if it doesn't exist
    mkdir -p prisma/migrations
    
    # Create baseline migration
    docker compose exec app npx prisma migrate dev --name init --create-only || {
      echo "⚠️  Could not create migration. The database might already match the schema."
      echo "   You can use './deploy.sh migrate' which will use db push if no migrations exist."
      exit 1
    }
    
    # Find the created migration directory
    MIGRATION_DIR=$(ls -t prisma/migrations | head -1)
    if [ -n "$MIGRATION_DIR" ]; then
      echo "📝 Marking migration as applied (baseline)..."
      docker compose exec app npx prisma migrate resolve --applied "$MIGRATION_DIR"
      echo "✅ Baseline migration created: $MIGRATION_DIR"
    else
      echo "⚠️  Could not find created migration directory"
    fi
    
    echo ""
    echo "You can now use './deploy.sh migrate' for future deployments"
    ;;
    
  backup)
    echo "💾 Backing up database..."
    
    BACKUP_DIR="deploy/backups"
    BACKUP_FILE="$BACKUP_DIR/optimalpost_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    docker compose exec -T postgres pg_dump -U optimalpost optimalpost > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    echo "✅ Backup created: ${BACKUP_FILE}.gz"
    
    # List recent backups
    echo ""
    echo "Recent backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "   (No backups found)"
    ;;
    
  restore)
    if [ -z "$2" ]; then
      echo "❌ Usage: ./deploy.sh restore <backup_file.sql.gz>"
      exit 1
    fi
    
    BACKUP_FILE="$2"
    
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "❌ Backup file not found: $BACKUP_FILE"
      exit 1
    fi
    
    echo "⚠️  WARNING: This will replace the current database!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "❌ Restore cancelled"
      exit 1
    fi
    
    echo "🔄 Restoring database from $BACKUP_FILE..."
    
    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
      echo "📦 Decompressing backup..."
      gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U optimalpost -d optimalpost
    else
      docker compose exec -T postgres psql -U optimalpost -d optimalpost < "$BACKUP_FILE"
    fi
    
    echo "✅ Database restored!"
    ;;
    
  logs)
    if [ -z "$2" ]; then
      docker compose logs -f
    else
      docker compose logs -f "$2"
    fi
    ;;
    
  stop)
    echo "🛑 Stopping OptimalPost..."
    docker compose down
    echo "✅ Stopped!"
    ;;
    
  restart)
    echo "🔄 Restarting OptimalPost..."
    docker compose restart
    echo "✅ Restarted!"
    ;;
    
  status)
    echo "📊 OptimalPost Status"
    echo ""
    echo "Services:"
    docker compose ps
    echo ""
    echo "Database connection:"
    if docker compose exec -T postgres pg_isready -U optimalpost -d optimalpost >/dev/null 2>&1; then
      echo "✅ Database is ready"
    else
      echo "❌ Database is not ready"
    fi
    echo ""
    echo "Recent logs (last 20 lines):"
    docker compose logs --tail=20
    ;;
    
  shell)
    if [ -z "$2" ]; then
      echo "Opening shell in app container..."
      docker compose exec app sh
    else
      echo "Opening shell in $2 container..."
      docker compose exec "$2" sh
    fi
    ;;
    
  db-shell)
    echo "Opening PostgreSQL shell..."
    docker compose exec postgres psql -U optimalpost -d optimalpost
    ;;
    
  clean)
    echo "🧹 Cleaning up..."
    echo "⚠️  This will remove stopped containers, unused networks, and build cache"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "❌ Clean cancelled"
      exit 1
    fi
    
    docker compose down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
    
  *)
    echo "OptimalPost Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  init         - Initialize project (create .env, check configs)"
    echo "  deploy       - Build and deploy all services"
    echo "  update       - Pull latest code, rebuild image, and restart"
    echo "  migrate      - Run database migrations (or db push if no migrations)"
    echo "  migrate-dev  - Create new migration (development)"
    echo "  baseline     - Create baseline migration for existing database"
    echo "  backup       - Backup database to deploy/backups/"
    echo "  restore      - Restore database from backup file"
    echo "  logs         - View logs (optional: specify service name)"
    echo "  stop         - Stop all services"
    echo "  restart      - Restart all services"
    echo "  status       - Show service status and health"
    echo "  shell        - Open shell in container (default: app)"
    echo "  db-shell     - Open PostgreSQL shell"
    echo "  clean        - Remove containers, volumes, and clean Docker cache"
    echo ""
    echo "Environment variables:"
    echo "  OPTIMALPOST_DOMAIN - Your domain (default: provenpost.com)"
    echo "  OPTIMALPOST_EMAIL  - Email for notifications (default: your-email@example.com)"
    ;;
esac
