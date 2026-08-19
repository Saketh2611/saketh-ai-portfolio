# Multi-stage build: install deps in a builder layer, copy only what's
# needed into the final image so torch/sentence-transformers' pip cache
# doesn't bloat the shipped image.

FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# --- Final image ---
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from the builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY . .

# BGE-M3 gets downloaded to this cache dir on first load if not baked
# into the image. For faster cold starts on a platform with persistent
# disk, mount a volume here; otherwise the first /health-triggered
# startup pays the download cost once per container lifetime.
ENV HF_HOME=/app/.cache/huggingface

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
