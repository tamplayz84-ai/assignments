# Q2 — Full Stack Course Enrollment System

Students can browse and enroll in courses. Admin manages courses and views enrollments.  
**Admin credentials:** `admin` / `admin123`  
**Backend port:** `5001`

---

## Project Structure

```
q2-enrollment/
├── frontend/
│   └── index.html          # All pages in one SPA
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

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start backend
```bash
python app.py
# Runs at http://localhost:5001
```

### 3. Open frontend
Open `frontend/index.html` in your browser.

---

## Run with Docker (Antigravity / Cloud Run)

```bash
docker build -t enrollment-app .
docker run -p 5001:5001 enrollment-app
```

### Deploy to Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/enrollment-app
gcloud run deploy enrollment-app \
  --image gcr.io/YOUR_PROJECT_ID/enrollment-app \
  --platform managed \
  --allow-unauthenticated \
  --port 5001
```

---

## API Endpoints

| Method | Endpoint               | Auth?  | Description                     |
|--------|------------------------|--------|---------------------------------|
| GET    | /courses               | No     | List all courses (search/filter)|
| GET    | /courses/<id>          | No     | Get course detail               |
| POST   | /courses               | Admin  | Add a course                    |
| PUT    | /courses/<id>          | Admin  | Update a course                 |
| DELETE | /courses/<id>          | Admin  | Delete a course                 |
| POST   | /enroll                | No     | Submit enrollment               |
| GET    | /enrollments           | Admin  | View all enrollments            |
| GET    | /enrollments/export    | Admin  | Download enrollments as CSV     |
| POST   | /login                 | No     | Admin login                     |
| POST   | /logout                | No     | Admin logout                    |

---

## Pages

| Page                | Nav                    |
|---------------------|------------------------|
| Courses List        | Courses link           |
| Course Detail       | Click any course card  |
| Enrollment Form     | "Enroll Now" link      |
| Admin Login         | Admin badge            |
| Admin Dashboard     | After login            |
| View Enrollments    | Dashboard → Enrollments|

---

## Database Tables

**courses** — id, title, description, duration, fee, teacher, category, created_at  
**enrollments** — id, student_name, email, phone, course_id, message, created_at  
**admin_users** — id, username, password (SHA-256 hashed)

---

## Extra Features Implemented

- ✅ Course search by title
- ✅ Course filter by category
- ✅ Export enrollments to CSV
- ✅ Form validation (frontend + backend)
- ✅ Hashed admin passwords
- ✅ Responsive layout

---

## What I Built & Learned

- Built a public course catalog with search and category filtering
- Created REST APIs with Flask including query parameter filtering
- Connected HTML forms to backend APIs using `fetch()`
- Stored relational data (enrollments reference courses via FK)
- Built an admin panel with session auth and CSV export
- Dockerized the app for deployment on Google Cloud Run
