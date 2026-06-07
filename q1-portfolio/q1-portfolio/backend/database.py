import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            technologies TEXT NOT NULL,
            github_link TEXT,
            live_link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        );
    ''')

    # Insert default admin if not exists (password: admin123 - hashed)
    import hashlib
    hashed = hashlib.sha256('admin123'.encode()).hexdigest()
    cursor.execute(
        "INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)",
        ('admin', hashed)
    )

    # Insert sample projects
    cursor.execute("SELECT COUNT(*) FROM projects")
    if cursor.fetchone()[0] == 0:
        sample_projects = [
            ('Portfolio Website', 'A full-stack personal portfolio with Flask backend and SQLite database.', 'HTML, CSS, JavaScript, Python, Flask, SQLite', 'https://github.com/example/portfolio', 'https://portfolio.example.com'),
            ('Task Manager App', 'A CRUD task management application with user authentication.', 'React, Node.js, MongoDB', 'https://github.com/example/taskmanager', ''),
            ('Weather Dashboard', 'Real-time weather app using OpenWeather API with beautiful charts.', 'HTML, CSS, JavaScript, OpenWeather API', 'https://github.com/example/weather', 'https://weather.example.com'),
        ]
        cursor.executemany(
            "INSERT INTO projects (title, description, technologies, github_link, live_link) VALUES (?, ?, ?, ?, ?)",
            sample_projects
        )

    conn.commit()
    conn.close()
