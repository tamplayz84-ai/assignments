# Q1 — Full Stack Portfolio Website

A personal portfolio with Flask backend, SQLite database, and vanilla JS frontend.  
**Admin credentials:** `admin` / `admin123`

---

## Project Structure

```
q1-portfolio/
├── frontend/
│   └── index.html          # All public + admin pages (SPA)
├── backend/
│   ├── app.py              # Flask app factory
│   ├── database.py         # SQLite init & connection
│   ├── routes.py           # All API endpoints
│   └── requirements.txt
├── database/
│   └── app.db              # Auto-created on first run
├── Dockerfile
└── README.md
```

---

## Run Locally

### 1. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the backend
```bash
python app.py
# Server runs at http://localhost:5000
```

### 3. Open the frontend
Open `frontend/index.html` in your browser (double-click or use Live Server in VS Code).

> The frontend connects to `http://localhost:5000` by default.

---

## Run with Docker (Antigravity / Cloud Run)

```bash
# Build
docker build -t portfolio-app .

# Run locally
docker run -p 5000:5000 portfolio-app
```

### Deploy to Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/portfolio-app
gcloud run deploy portfolio-app \
  --image gcr.io/YOUR_PROJECT_ID/portfolio-app \
  --platform managed \
  --allow-unauthenticated \
  --port 5000
```

---

## API Endpoints

| Method | Endpoint          | Auth?  | Description              |
|--------|-------------------|--------|--------------------------|
| GET    | /projects         | No     | List all projects        |
| POST   | /projects         | Admin  | Add a project            |
| PUT    | /projects/<id>    | Admin  | Update a project         |
| DELETE | /projects/<id>    | Admin  | Delete a project         |
| POST   | /contact          | No     | Submit contact message   |
| GET    | /messages         | Admin  | View contact messages    |
| DELETE | /messages/<id>    | Admin  | Delete a message         |
| POST   | /login            | No     | Admin login              |
| POST   | /logout           | No     | Admin logout             |

---

## Pages

| Page             | URL / Nav         |
|------------------|-------------------|
| Home             | Home link         |
| About            | About link        |
| Projects         | Projects link     |
| Contact          | Contact link      |
| Admin Login      | Admin link        |
| Admin Dashboard  | After login       |
| Messages         | Dashboard → Messages |

---

## Database Tables

**projects** — id, title, description, technologies, github_link, live_link, created_at  
**messages** — id, name, email, subject, message, created_at  
**admin_users** — id, username, password (SHA-256 hashed)

---

## What I Built & Learned

- Separated frontend and backend concerns (SPA + REST API)
- Created a Flask REST API with CRUD operations
- Connected HTML forms to backend with `fetch()`
- Designed and queried an SQLite database
- Built an admin panel with session-based authentication
- Hashed passwords with SHA-256 instead of plain text storage
