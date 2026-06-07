import sqlite3
import os
import hashlib

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
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            duration TEXT NOT NULL,
            fee REAL NOT NULL,
            teacher TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            course_id INTEGER NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        );
    ''')

    # Default admin
    hashed = hashlib.sha256('admin123'.encode()).hexdigest()
    cursor.execute(
        "INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)",
        ('admin', hashed)
    )

    # Sample courses
    cursor.execute("SELECT COUNT(*) FROM courses")
    if cursor.fetchone()[0] == 0:
        sample_courses = [
            ('Python for Beginners', 'Learn Python from scratch. Variables, loops, functions, OOP, and file handling.', '8 Weeks', 4500, 'Dr. Sarah Ahmed', 'Programming'),
            ('Full Stack Web Development', 'Build real-world web apps using HTML, CSS, JavaScript, Flask, and SQLite.', '16 Weeks', 12000, 'Mr. Ali Hassan', 'Web Development'),
            ('Data Science with Python', 'Data analysis, Pandas, NumPy, Matplotlib, and intro to Machine Learning.', '12 Weeks', 9500, 'Ms. Fatima Khan', 'Data Science'),
            ('React.js Masterclass', 'Modern React with hooks, context, React Router, and API integration.', '10 Weeks', 8000, 'Mr. Usman Tariq', 'Web Development'),
            ('UI/UX Design Fundamentals', 'Figma, wireframing, prototyping, and user research principles.', '6 Weeks', 5500, 'Ms. Ayesha Malik', 'Design'),
        ]
        cursor.executemany(
            "INSERT INTO courses (title, description, duration, fee, teacher, category) VALUES (?,?,?,?,?,?)",
            sample_courses
        )

    conn.commit()
    conn.close()
