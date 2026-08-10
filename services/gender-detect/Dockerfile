# Kaafilla gender-detection service (OpenCV + Caffe gender model).
FROM python:3.11-slim

# opencv-python-headless needs libGL/glib at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Pre-download the model files at build time so the first request is fast.
RUN python -c "import app"

ENV PORT=8080
EXPOSE 8080
# 1 worker keeps the ~loaded model in memory; bump workers with more RAM.
CMD ["gunicorn", "-b", "0.0.0.0:8080", "-w", "1", "-t", "60", "app:app"]
