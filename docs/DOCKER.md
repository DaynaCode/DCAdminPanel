# Docker Guide

Quick guide for running django-unfold with Docker.

## Quick Start (1 minute)

```bash
# Clone
git clone https://github.com/DaynaCode/DCAdminPanel.git
cd DCAdminPanel

# Configure
cp .env.example .env
# Edit .env: change SECRET_KEY and DB_PASSWORD

# Build and run
docker compose up -d --build

# Create admin user
docker compose exec web python manage.py createsuperuser

# Open in browser
open http://localhost:8080/admin/
```

That's it! Login with the superuser you just created. The admin will be in
English by default — use the language switcher (top-right) to switch to Persian.

## Services

The `docker-compose.yml` starts 3 services:

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| `db` | PostgreSQL 16 | 5432 (internal) | Database |
| `redis` | Redis 7 | 6379 (internal) | Cache & sessions |
| `web` | Django + Gunicorn | 8080 (host) → 8000 (container) | Web app |

## Common Commands

### View logs

```bash
# All services
docker compose logs -f

# Just the web app
docker compose logs -f web

# Last 100 lines
docker compose logs --tail 100 web
```

### Restart a service

```bash
docker compose restart web
docker compose restart db
```

### Stop and start

```bash
# Stop (keeps data)
docker compose stop

# Start again
docker compose start

# Stop and remove containers (keeps volumes/data)
docker compose down

# Stop and remove EVERYTHING including data
docker compose down -v
```

### Run Django management commands

```bash
# Migrations
docker compose exec web python manage.py migrate

# Create superuser
docker compose exec web python manage.py createsuperuser

# Collect static
docker compose exec web python manage.py collectstatic --noinput

# Compile translations
docker compose exec web python manage.py compilemessages

# Django shell
docker compose exec web python manage.py shell

# Run tests
docker compose exec web pytest tests/ --no-cov
```

### Access PostgreSQL

```bash
# Connect to the database
docker compose exec db psql -U dcadmin -d dcadmin

# Backup
docker compose exec db pg_dump -U dcadmin dcadmin > backup.sql

# Restore
cat backup.sql | docker compose exec -T db psql -U dcadmin -d dcadmin
```

### Access Redis

```bash
docker compose exec redis redis-cli
```

## Building the Image

### Build manually

```bash
docker build -t dcadminpanel:latest .
```

### Build without cache (force fresh build)

```bash
docker build --no-cache -t dcadminpanel:latest .
```

### Build for production (multi-arch)

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t dcadminpanel:latest .
```

## Environment Variables

See [`.env.example`](.env.example) for all options. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | Django secret key |
| `DEBUG` | `False` | Debug mode |
| `ALLOWED_HOSTS` | `*` | Allowed hostnames |
| `LANGUAGE_CODE` | `fa` | Default language |
| `TIME_ZONE` | `Asia/Tehran` | Default timezone |
| `DB_PASSWORD` | (required) | PostgreSQL password |
| `WEB_PORT` | `8080` | Host port for the web app |

## Volumes

| Volume | Mount point | Purpose |
|--------|-------------|---------|
| `postgres_data` | `/var/lib/postgresql/data` | Database files |
| `redis_data` | `/data` | Redis persistence |
| `static_files` | `/app/staticfiles` | Collected static files |
| `media_files` | `/app/media` | User uploads |

## Production Deployment

For production, you should:

1. **Set strong passwords** in `.env`
2. **Enable HTTPS** with Nginx + Let's Encrypt (see [DEPLOYMENT.md](docs/DEPLOYMENT.md))
3. **Set `DEBUG=False`**
4. **Configure `ALLOWED_HOSTS`** with your domain
5. **Set up backups** (see [DEPLOYMENT.md](docs/DEPLOYMENT.md#11-backup--recovery))

### With Nginx + HTTPS

Uncomment the `nginx` service in `docker-compose.yml`, then:

```bash
# Get SSL certificate
docker compose run --rm certbot certonly --webroot --webroot-path=/usr/share/nginx/html --email your@email.com --agree-tos --no-eff-email -d yourdomain.com

# Start everything
docker compose up -d
```

## Troubleshooting

### Port already in use

```bash
# Check what's using port 8080
sudo lsof -i :8080

# Or use a different port
WEB_PORT=9000 docker compose up -d
```

### Database connection errors

```bash
# Check if db is healthy
docker compose ps db

# Check db logs
docker compose logs db

# Reset database (DESTRUCTIVE — loses all data)
docker compose down -v
docker compose up -d --build
```

### Permission denied on volumes

```bash
# Fix ownership
sudo chown -R $USER:$USER staticfiles media_files

# Or rebuild
docker compose down
docker compose up -d --build
```

### Static files not loading

```bash
# Re-collect static files
docker compose exec web python manage.py collectstatic --noinput

# Restart web
docker compose restart web
```

### Persian text not showing

```bash
# Compile translations
docker compose exec web python manage.py compilemessages

# Restart web
docker compose restart web
```

### Jalali calendar not appearing

The calendar only loads when `LANGUAGE_BIDI` is true (i.e., the active
language is RTL). To force Persian:

1. Set `LANGUAGE_CODE=fa` in `.env`
2. Restart: `docker compose restart web`
3. Or use the language switcher in the admin header

## Development with Docker

### Live code reloading

For development, mount your source code as a volume:

```yaml
# docker-compose.override.yml (not committed)
services:
  web:
    volumes:
      - ./src:/app/src
      - ./tests:/app/tests
    command: >
      sh -c "python manage.py migrate --noinput &&
             python manage.py runserver 0.0.0.0:8000 --noreload"
    environment:
      - DEBUG=True
```

Then:

```bash
docker compose up -d
docker compose logs -f web
```

Changes to Python files will be picked up on the next request (no restart needed
with `--noreload`).

### Running tests in Docker

```bash
docker compose exec web pytest tests/ -v --no-cov
```

### Debugging with pdb

```bash
docker compose exec web python manage.py runserver 0.0.0.0:8000 --noreload
# In another terminal:
docker attach dcadmin_web
```

## Cleanup

```bash
# Stop and remove containers
docker compose down

# Also remove volumes (DATABASE WILL BE LOST)
docker compose down -v

# Remove the built image
docker rmi dcadminpanel:latest

# Remove dangling images
docker image prune -f
```
