FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY database/ ./database/

WORKDIR /app/backend

EXPOSE 5001

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

CMD ["python", "app.py"]
