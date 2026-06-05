import sqlite3

DB_FILE = "database.db"

def get_db_connection():
    """Establishes a connection to the database and allows column access by name."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database using the schema.sql file."""
    conn = get_db_connection()
    with open('schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

# --- STUDENT OPERATIONS ---
def get_all_students():
    conn = get_db_connection()
    students = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    return students

def add_student(name, email, phone):
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO students (name, email, phone) VALUES (?, ?, ?)",
            (name, email, phone)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Email already exists
    finally:
        conn.close()

# --- ENROLLMENT OPERATIONS ---
def get_detailed_enrollments():
    """Fetches enrollments combined with Student and Course names using SQL JOINs."""
    conn = get_db_connection()
    query = """
        SELECT e.id, s.name AS student_name, c.course_name, e.enrollment_date, e.status 
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
    """
    enrollments = conn.execute(query).fetchall()
    conn.close()
    return enrollments

def enroll_student(student_id, course_id):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
        (student_id, course_id)
    )
    conn.commit()
    conn.close()