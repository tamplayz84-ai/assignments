FROM python:3.11-slim

WORKDIR /app

# Copy backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY database/ ./database/

# Serve static frontend from Flask
RUN pip install --no-cache-dir flask-cors

WORKDIR /app/backend

EXPOSE 5000

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

CMD ["python", "app.py"]
