---
title: Deployment
order: 100
description: Complete deployment guide for django-unfold with Persian RTL and Jalali calendar support — covers production setup, Docker, reverse proxies, security, and performance.
---

# Deployment Guide

This guide covers production deployment of django-unfold with Persian RTL
and Jalali calendar support. For local development setup, see
[Development Guide](./DEVELOPMENT.md).

---

## Table of Contents

1. [Production Checklist](#1-production-checklist)
2. [Quick Start (Docker)](#2-quick-start-docker)
3. [Manual Installation](#3-manual-installation)
4. [Configuration Reference](#4-configuration-reference)
5. [Reverse Proxy Setup (Nginx)](#5-reverse-proxy-setup-nginx)
6. [Static Files & CDN](#6-static-files--cdn)
7. [Database Options](#7-database-options)
8. [Security Hardening](#8-security-hardening)
9. [Performance Tuning](#9-performance-tuning)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [Backup & Recovery](#11-backup--recovery)
12. [Upgrading](#12-upgrading)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Production Checklist

Before going to production, verify:

- [ ] `DEBUG = False` in settings
- [ ] `SECRET_KEY` set from environment variable (not hardcoded)
- [ ] `ALLOWED_HOSTS` lists all production domains
- [ ] HTTPS enabled (with auto-renewing certificates)
- [ ] Database connection uses connection pooling
- [ ] Static files served via CDN or Nginx (not Django)
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] Email backend configured for production (SMTP)
- [ ] Logging configured (file rotation + error notifications)
- [ ] Database backups scheduled
- [ ] Persian language (`fa`) tested end-to-end
- [ ] Jalali calendar widget tested in date fields
- [ ] `.mo` files compiled (`compilemessages`)

---

## 2. Quick Start (Docker)

The fastest way to deploy. Requires Docker 20+ and Docker Compose 2+.

### 2.1 Using docker-compose (recommended)

Create a `docker-compose.yml` in your project root:

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-unfold}
      POSTGRES_USER: ${DB_USER:-unfold}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change_me_in_production}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-unfold}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  web:
    build: .
    command: >
      sh -c "python manage.py migrate --noinput &&
             python manage.py collectstatic --noinput &&
             python manage.py compilemessages &&
             gunicorn myproject.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 2 --timeout 120"
    environment:
      - DJANGO_SETTINGS_MODULE=myproject.settings.production
      - SECRET_KEY=${SECRET_KEY:-please_change_me}
      - DEBUG=False
      - ALLOWED_HOSTS=${ALLOWED_HOSTS:-localhost}
      - DATABASE_URL=postgres://${DB_USER:-unfold}:${DB_PASSWORD:-change_me_in_production}@db:5432/${DB_NAME:-unfold}
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - static_files:/app/staticfiles
      - media_files:/app/media
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static_files:/usr/share/nginx/static:ro
      - media_files:/usr/share/nginx/media:ro
      - ./certs:/etc/nginx/certs:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
  media_files:
```

### 2.2 Dockerfile

```dockerfile
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml uv.lock* requirements*.txt ./
RUN pip install --upgrade pip && \
    pip install uv && \
    uv pip install --system -r requirements.txt 2>/dev/null || \
    pip install -r requirements.txt 2>/dev/null || \
    pip install .

# ---- Runtime stage ----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=myproject.settings.production

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gettext \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project files
COPY --chown=app:app . /app

# Compile translation files
RUN python -m django compilemessages 2>/dev/null || true

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health/', timeout=5)" || exit 1

CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### 2.3 Build and run

```bash
# Clone the project
git clone https://github.com/DaynaCode/DCAdminPanel.git myproject
cd myproject

# Create .env file
cp .env.example .env
# Edit .env with your production values

# Build and start
docker compose up -d --build

# Create a superuser
docker compose exec web python manage.py createsuperuser

# Check logs
docker compose logs -f web
```

### 2.4 HTTPS with Let's Encrypt

For automatic HTTPS, add Certbot to your compose file:

```yaml
  certbot:
    image: certbot/certbot
    volumes:
      - ./certs:/etc/letsencrypt
      - ./certbot-data:/var/lib/letsencrypt
    command: certonly --webroot --webroot-path=/usr/share/nginx/html --email your@email.com --agree-tos --no-eff-email -d yourdomain.com
    depends_on:
      - nginx
```

---

## 3. Manual Installation

### 3.1 System requirements

- Python 3.12+
- PostgreSQL 14+ (recommended) or MySQL 8+ or SQLite
- Redis 6+ (for caching, optional)
- Nginx or Caddy (reverse proxy)

### 3.2 Install Python dependencies

```bash
# Clone repository
git clone https://github.com/DaynaCode/DCAdminPanel.git
cd DCAdminPanel

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install
pip install -e .
# Or install from PyPI (once published):
# pip install django-unfold
```

### 3.3 Configure your Django project

In your project's `settings.py`:

```python
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    # ... other unfold contrib apps you need ...
    "django.contrib.admin",
    "django.contrib.auth",
    # ...
]

MIDDLEWARE = [
    # ... other middleware ...
    "django.middleware.locale.LocaleMiddleware",  # Required for i18n
    # ...
]

# i18n settings
LANGUAGE_CODE = "fa"  # or "en"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = (
    ("fa", _("Persian")),
    ("en", _("English")),
)

LOCALE_PATHS = [
    BASE_DIR / "locale",
    # If you installed django-unfold as a package, its locale dir is auto-discovered.
    # If running from source, add its path:
    # Path(django_unfold.__file__).parent / "locale",
]

# Unfold configuration
UNFOLD = {
    "SHOW_LANGUAGES": True,
    "LANGUAGES": {
        "navigation": [
            {
                "bidi": True,
                "code": "fa",
                "name": "Persian",
                "name_local": "فارسی",
                "name_translated": "Persian",
            },
            {
                "bidi": False,
                "code": "en",
                "name": "English",
                "name_local": "English",
                "name_translated": "English",
            },
        ],
    },
}
```

### 3.4 URL configuration

```python
# urls.py
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Language switch endpoint
    path("i18n/", include("django.conf.urls.i18n")),
]
```

If you want language-prefixed URLs (`/fa/admin/`, `/en/admin/`):

```python
from django.conf.urls.i18n import i18n_patterns

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
]
urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
)
```

### 3.5 Run migrations and collect static

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py compilemessages  # Compile Persian translations
python manage.py createsuperuser
```

### 3.6 Run with Gunicorn

```bash
pip install gunicorn
gunicorn myproject.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

---

## 4. Configuration Reference

### 4.1 Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (none) | Django secret key (required in production) |
| `DEBUG` | `False` | Django debug mode |
| `ALLOWED_HOSTS` | `localhost` | Comma-separated list of allowed hosts |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Database connection URL |
| `REDIS_URL` | (none) | Redis connection URL (for caching) |
| `LANGUAGE_CODE` | `fa` | Default language code |
| `TIME_ZONE` | `Asia/Tehran` | Default timezone |
| `EMAIL_HOST` | (none) | SMTP server host |
| `EMAIL_PORT` | `587` | SMTP server port |
| `EMAIL_HOST_USER` | (none) | SMTP username |
| `EMAIL_HOST_PASSWORD` | (none) | SMTP password |
| `EMAIL_USE_TLS` | `True` | Use TLS for email |

### 4.2 Unfold-specific settings

See `src/unfold/settings.py` for the full `CONFIG_DEFAULTS` dict. Key ones:

| Setting | Default | Description |
|---------|---------|-------------|
| `SITE_TITLE` | `None` | Browser tab title |
| `SITE_HEADER` | `None` | Header text in admin |
| `SITE_SUBHEADER` | `None` | Subtitle in admin |
| `SITE_LOGO` | `None` | Logo image URL |
| `SITE_FAVICONS` | `[]` | List of favicon dicts |
| `SHOW_HISTORY` | `True` | Show recent actions sidebar |
| `SHOW_VIEW_ON_SITE` | `True` | Show "View on site" links |
| `SHOW_LANGUAGES` | `False` | Show language switcher |
| `SHOW_BACK_BUTTON` | `False` | Show back button in header |
| `COLORS` | (see defaults) | Color palette overrides |
| `DASHBOARD_CALLBACK` | `None` | Callable to customize dashboard |
| `TABS` | `[]` | Custom tabs configuration |

### 4.3 Persian-specific settings

```python
UNFOLD = {
    # Show language switcher in header
    "SHOW_LANGUAGES": True,

    # Custom language list with bidi flag
    "LANGUAGES": {
        "navigation": [
            {
                "bidi": True,           # KEY: marks as RTL
                "code": "fa",
                "name": "Persian",
                "name_local": "فارسی",
                "name_translated": "Persian",
            },
        ],
    },

    # Custom flags (emoji) for the language switcher
    "LANGUAGE_FLAGS": {
        "fa": "🇮🇷",
        "en": "🇬🇧",
    },
}
```

---

## 5. Reverse Proxy Setup (Nginx)

### 5.1 Basic Nginx config

```nginx
# /etc/nginx/sites-available/myproject
upstream gunicorn {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files (served directly by Nginx)
    location /static/ {
        alias /path/to/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /path/to/media/;
        expires 7d;
    }

    # Vazirmatn font files — cache aggressively (1 year)
    location ~* \.woff2$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # Main proxy to Gunicorn
    location / {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_read_timeout 120s;
    }

    # Increase max upload size (for file uploads in admin)
    client_max_body_size 50M;
}
```

### 5.2 Enable and reload

```bash
sudo ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Static Files & CDN

### 6.1 Whitenoise (simplest)

For small to medium deployments, use Whitenoise to serve static files directly
from Gunicorn:

```python
# settings.py
MIDDLEWARE = [
    # ... 
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Right after SecurityMiddleware
    # ...
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
```

### 6.2 S3/CDN

For large deployments, use S3 or any S3-compatible storage (MinIO, Cloudflare R2):

```python
# settings.py
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = "my-bucket"
AWS_S3_REGION_NAME = "eu-west-1"
AWS_S3_CUSTOM_DOMAIN = "cdn.mydomain.com"

STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/static/"
STATICFILES_STORAGE = "storages.backends.s3.S3ManifestStaticStorage"

MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
DEFAULT_FILE_STORAGE = "storages.backends.s3.S3Boto3Storage"
```

```bash
pip install django-storages boto3
```

---

## 7. Database Options

### 7.1 PostgreSQL (recommended)

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "unfold"),
        "USER": os.environ.get("DB_USER", "unfold"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,  # Connection pooling
        "OPTIONS": {
            "connect_timeout": 10,
        },
    },
}
```

Or use `dj-django-url`:

```bash
pip install dj-database-url
```

```python
import dj_database_url
DATABASES = {"default": dj_database_url.config(default="postgres://user:pass@host:5432/db")}
```

### 7.2 MySQL

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("DB_NAME", "unfold"),
        "USER": os.environ.get("DB_USER", "unfold"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
        },
    },
}
```

### 7.3 SQLite (development only)

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    },
}
```

---

## 8. Security Hardening

### 8.1 Production settings

```python
# settings/production.py

# Disable debug
DEBUG = False

# Allowed hosts
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"

# Email
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = "noreply@mydomain.com"

# Caching
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0"),
        "TIMEOUT": 300,
    }
}

# Sessions — use cache-backed sessions for performance
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

# CSRF — use cache-backed CSRF for performance
CSRF_USE_SESSIONS = False

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Rate limiting (optional, requires django-ratelimit)
# pip install django-ratelimit
```

### 8.2 Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 8.3 Fail2ban (brute force protection)

```ini
# /etc/fail2ban/jail.d/django-admin.conf
[django-admin]
enabled = true
port = http,https
filter = django-admin
logpath = /var/log/nginx/access.log
maxretry = 5
findtime = 600
bantime = 3600
```

```ini
# /etc/fail2ban/filter.d/django-admin.conf
[Definition]
failregex = ^<HOST>.*POST /admin/login.* 403
ignoreregex =
```

---

## 9. Performance Tuning

### 9.1 Gunicorn workers

Rule of thumb: `(2 × CPU cores) + 1` workers.

```bash
# Check CPU count
nproc

# Run Gunicorn
gunicorn myproject.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 5 \
    --threads 2 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --graceful-timeout 30
```

### 9.2 Database connection pooling

Use PgBouncer for connection pooling:

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
myproject = host=127.0.0.1 port=5432 dbname=myproject

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
```

### 9.3 Caching strategy

```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/0",
        "TIMEOUT": 300,
        "OPTIONS": {
            "parser_class": "redis.connection.HiredisParser",
            "connection_pool_class": "redis.BlockingConnectionPool",
            "connection_pool_class_kwargs": {
                "max_connections": 50,
                "timeout": 20,
            },
        },
    }
}
```

### 9.4 Database indexes

Ensure your frequently-filtered fields have indexes:

```python
class MyModel(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["name", "created_at"]),
        ]
```

---

## 10. Monitoring & Logging

### 10.1 Logging configuration

```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/django/myproject.log",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 10,
            "formatter": "verbose",
        },
        "mail_admins": {
            "level": "ERROR",
            "class": "django.utils.log.AdminEmailHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["file", "mail_admins"],
            "level": "ERROR",
            "propagate": False,
        },
        "unfold": {
            "handlers": ["file"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["file"],
        "level": "WARNING",
    },
}
```

### 10.2 Sentry integration (optional)

```bash
pip install sentry-sdk
```

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=True,
    environment="production",
)
```

### 10.3 Health check endpoint

```python
# urls.py
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("health/", health_check),
    # ...
]
```

### 10.4 Prometheus metrics (optional)

```bash
pip install django-prometheus
```

```python
INSTALLED_APPS = [
    "django_prometheus",
    # ...
]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    # ...
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

urlpatterns = [
    path("", include("django_prometheus.urls")),
    # ...
]
```

---

## 11. Backup & Recovery

### 11.1 Database backup script

```bash
#!/bin/bash
# backup_db.sh

set -e

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/myproject_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# Backup
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner --no-privileges \
    | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "myproject_*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE"

# Optional: upload to S3
# aws s3 cp $BACKUP_FILE s3://my-bucket/backups/
```

Add to crontab:

```cron
# /etc/crontab
0 2 * * * root /usr/local/bin/backup_db.sh >> /var/log/backup.log 2>&1
```

### 11.2 Media files backup

```bash
#!/bin/bash
# backup_media.sh

MEDIA_DIR="/path/to/media"
BACKUP_DIR="/var/backups/media"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/media_$TIMESTAMP.tar.gz" -C "$MEDIA_DIR" .

# Keep only last 7 days
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete
```

### 11.3 Restore procedure

```bash
# Stop the app
docker compose down

# Restore database
gunzip -c /var/backups/postgres/myproject_20260903_020000.sql.gz | \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Restore media
tar -xzf /var/backups/media/media_20260903_020000.tar.gz -C /path/to/media/

# Restart
docker compose up -d
```

---

## 12. Upgrading

### 12.1 Backup before upgrade

```bash
# Always backup before upgrading
./backup_db.sh
./backup_media.sh
```

### 12.2 Pull latest changes

```bash
git pull origin main
# Or, if installed via pip:
# pip install --upgrade django-unfold
```

### 12.3 Apply migrations

```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py compilemessages
```

### 12.4 Restart services

```bash
# Docker
docker compose restart web

# Systemd
sudo systemctl restart gunicorn
```

### 12.5 Verify

```bash
# Check health
curl https://yourdomain.com/health/

# Check admin loads
curl -I https://yourdomain.com/admin/

# Check Persian language works
curl -H "Accept-Language: fa" https://yourdomain.com/admin/ | grep -c "خوش آمدید"
```

---

## 13. Troubleshooting

### 13.1 Persian text not displaying

**Symptom:** Admin shows English text even with `LANGUAGE_CODE = "fa"`.

**Fix:**
1. Check `USE_I18N = True` in settings.
2. Run `python manage.py compilemessages` to compile `.mo` files.
3. Check `LOCALE_PATHS` includes the unfold locale directory.
4. Verify browser sends `Accept-Language: fa` header.

### 13.2 RTL layout not applied

**Symptom:** Layout is LTR even with Persian language.

**Fix:**
1. Check `LANGUAGE_CODE = "fa"` in settings.
2. In `UNFOLD["LANGUAGES"]["navigation"]`, ensure the `fa` entry has `"bidi": True`.
3. Verify the `<html>` tag has `dir="rtl"` in browser dev tools.
4. Clear browser cache (CSS might be cached).

### 13.3 Vazirmatn font not loading

**Symptom:** Persian text uses Tahoma fallback instead of Vazirmatn.

**Fix:**
1. Check `src/unfold/static/unfold/fonts/vazirmatn/styles.css` exists.
2. Check `skeleton.html` loads it: `<link href="{% static "unfold/fonts/vazirmatn/styles.css" %}">`.
3. Run `python manage.py collectstatic --noinput` to copy fonts to `STATIC_ROOT`.
4. Check browser Network tab — the `.woff2` files should return HTTP 200.
5. Verify Nginx serves `.woff2` with `Access-Control-Allow-Origin "*"`.

### 13.4 Jalali calendar not appearing

**Symptom:** Date input field shows a plain text input without the calendar popup.

**Fix:**
1. Check that `LANGUAGE_BIDI` is `True` (only loads `jalali.js` in RTL mode).
2. Check the date widget template uses `data-jalali-datepicker` attribute.
3. Verify `jalali.js` is loaded in browser (check Network tab).
4. Check browser console for JavaScript errors.
5. Ensure the input has `data-jalali-datepicker` attribute after page render.

### 13.5 Date not saving correctly

**Symptom:** User picks a Jalali date in the calendar, but the saved value is wrong.

**Fix:**
1. The visible input shows the Jalali date, but the submitted value should be ISO Gregorian.
2. Check that `form.addEventListener("submit", ...)` in `jalali.js` is firing.
3. Verify the `data-gregorian` attribute is set on the input.
4. Check server-side: the received value should be `YYYY-MM-DD` (Gregorian ISO).

### 13.6 Static files 404 in production

**Symptom:** CSS/JS/fonts return 404.

**Fix:**
1. Run `python manage.py collectstatic --noinput`.
2. Check `STATIC_ROOT` is set and Nginx serves from there.
3. Check `STATIC_URL` matches Nginx `location /static/` block.
4. If using Whitenoise, ensure it's in `MIDDLEWARE` after `SecurityMiddleware`.

### 13.7 Database connection errors

**Symptom:** "could not connect to server" errors.

**Fix:**
1. Check `DATABASE_URL` environment variable.
2. Test connectivity: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`.
3. Check firewall allows the database port.
4. If using Docker, ensure `depends_on` includes the `db` service.
5. Check `CONN_MAX_AGE` is not too high (causes stale connections).

### 13.8 Memory issues

**Symptom:** OOM killer terminates Gunicorn workers.

**Fix:**
1. Reduce Gunicorn workers: `--workers 3` instead of `--workers 8`.
2. Use `--max-requests 500 --max-requests-jitter 50` to recycle workers.
3. Increase server RAM.
4. Check for memory leaks in custom code with `memory_profiler`.

### 13.9 Slow admin pages

**Symptom:** Changelist pages take >5 seconds to load.

**Fix:**
1. Add database indexes on filtered fields.
2. Use `select_related` and `prefetch_related` in admin querysets.
3. Reduce `list_display` fields (each column adds a query).
4. Use `list_select_related = False` if not needed.
5. Enable database query caching with `django-cachalot`.

### 13.10 Getting help

If you're still stuck:

1. Check the [Issues](https://github.com/DaynaCode/DCAdminPanel/issues) page.
2. Search the [upstream Unfold discussions](https://github.com/unfoldadmin/django-unfold/discussions).
3. Open a new issue with:
   - Django version
   - Unfold version (`pip show django-unfold`)
   - Python version
   - Browser and OS
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant log excerpts (redact sensitive info)
