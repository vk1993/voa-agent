FROM python:3.12-slim

WORKDIR /app

# Install spaCy English model (needed by Presidio)
RUN pip install --no-cache-dir spacy && \
    python -m spacy download en_core_web_lg

COPY core /app/core
RUN pip install --no-cache-dir -e /app/core

COPY . /app/agent
RUN pip install --no-cache-dir -e /app/agent

ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
