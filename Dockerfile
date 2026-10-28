# Multi-stage lightweight production Dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime image
FROM python:3.12-slim AS runner

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user for security
RUN groupadd -r studygroup && useradd -r -g studygroup studyuser

# Copy installed dependencies from builder
COPY --from=builder /root/.local /home/studyuser/.local
ENV PATH=/home/studyuser/.local/bin:$PATH

# Copy application code
COPY app /app/app
COPY pyproject.toml /app/pyproject.toml

# Prepare data directory with proper permissions
RUN mkdir -p /app/data && chown -R studyuser:studygroup /app

USER studyuser

ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Production server start
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
