# =============================================================================
# Dockerfile for django-unfold with Persian RTL support
# =============================================================================
# Multi-stage build: builder stage installs dependencies, runtime stage is slim.
#
# Build:   docker build -t dcadminpanel:latest .
# Run:     docker run -p 8000:8000 --env-file .env dcadminpanel:latest
#
# For docker-compose usage, see docker-compose.yml
# =============================================================================

# ---------- Builder stage ----------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install build dependencies (gettext for compilemessages, libpq-dev for psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gettext \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv (fast Python package installer) — optional, but speeds up builds
RUN pip install uv

# Copy dependency files first (better layer caching)
COPY pyproject.toml ./
# If you have a requirements.txt, uncomment the next line:
# COPY requirements.txt ./

# Install Python dependencies
# Using uv if uv.lock exists, otherwise pip
RUN if [ -f uv.lock ]; then \
        uv pip install --system . ; \
    else \
        pip install . ; \
    fi

# ---------- Runtime stage ----------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=example.settings \
    PATH="/home/app/.local/bin:${PATH}"

WORKDIR /app

# Install runtime dependencies (libpq5 for psycopg, gettext for compilemessages,
# curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        gettext \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app --shell /bin/bash app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project files
COPY --chown=app:app . /app

# Switch to non-root user
USER app

# Compile Persian translation files (idempotent — skips if .mo is up-to-date)
RUN cd src/unfold && python -m django compilemessages 2>/dev/null || true

# Expose port
EXPOSE 8000

# Health check (hits /health/ endpoint — make sure you have one)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health/ || exit 1

# Use tini as init (handles signals properly — Ctrl+C, SIGTERM)
ENTRYPOINT ["/usr/bin/tini", "--"]

# Default command — can be overridden in docker-compose.yml
CMD ["gunicorn", "example.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--threads", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
