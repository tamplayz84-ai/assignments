from flask import request, jsonify, session
import hashlib
import csv
import io
from database import get_db
from functools import wraps

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

def register_routes(app):

    # ── AUTH ──────────────────────────────────────────────────────
    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        password = hashlib.sha256(data.get('password', '').encode()).hexdigest()
        db = get_db()
        user = db.execute(
            "SELECT * FROM admin_users WHERE username=? AND password=?",
            (data.get('username', ''), password)
        ).fetchone()
        db.close()
        if user:
            session['admin_logged_in'] = True
            return jsonify({'message': 'Login successful'})
        return jsonify({'error': 'Invalid credentials'}), 401

    @app.route('/logout', methods=['POST'])
    def logout():
        session.pop('admin_logged_in', None)
        return jsonify({'message': 'Logged out'})

    # ── COURSES ───────────────────────────────────────────────────
    @app.route('/courses', methods=['GET'])
    def get_courses():
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        db = get_db()
        query = "SELECT * FROM courses WHERE 1=1"
        params = []
        if search:
            query += " AND title LIKE ?"
            params.append(f'%{search}%')
        if category:
            query += " AND category = ?"
            params.append(category)
        query += " ORDER BY created_at DESC"
        rows = db.execute(query, params).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows])

    @app.route('/courses/<int:cid>', methods=['GET'])
    def get_course(cid):
        db = get_db()
        row = db.execute("SELECT * FROM courses WHERE id=?", (cid,)).fetchone()
        db.close()
        if not row:
            return jsonify({'error': 'Course not found'}), 404
        return jsonify(dict(row))

    @app.route('/courses', methods=['POST'])
    @admin_required
    def add_course():
        data = request.get_json()
        db = get_db()
        db.execute(
            "INSERT INTO courses (title, description, duration, fee, teacher, category) VALUES (?,?,?,?,?,?)",
            (data['title'], data['description'], data['duration'],
             data['fee'], data['teacher'], data.get('category', 'General'))
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Course added'}), 201

    @app.route('/courses/<int:cid>', methods=['PUT'])
    @admin_required
    def update_course(cid):
        data = request.get_json()
        db = get_db()
        db.execute(
            "UPDATE courses SET title=?, description=?, duration=?, fee=?, teacher=?, category=? WHERE id=?",
            (data['title'], data['description'], data['duration'],
             data['fee'], data['teacher'], data.get('category', 'General'), cid)
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Course updated'})

    @app.route('/courses/<int:cid>', methods=['DELETE'])
    @admin_required
    def delete_course(cid):
        db = get_db()
        db.execute("DELETE FROM courses WHERE id=?", (cid,))
        db.commit()
        db.close()
        return jsonify({'message': 'Course deleted'})

    # ── ENROLLMENTS ───────────────────────────────────────────────
    @app.route('/enroll', methods=['POST'])
    def enroll():
        data = request.get_json()
        # Validation
        required = ['student_name', 'email', 'phone', 'course_id']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        db = get_db()
        # Check course exists
        course = db.execute("SELECT id FROM courses WHERE id=?", (data['course_id'],)).fetchone()
        if not course:
            db.close()
            return jsonify({'error': 'Course not found'}), 404
        db.execute(
            "INSERT INTO enrollments (student_name, email, phone, course_id, message) VALUES (?,?,?,?,?)",
            (data['student_name'], data['email'], data['phone'],
             data['course_id'], data.get('message', ''))
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Enrollment successful! You will be contacted shortly.'}), 201

    @app.route('/enrollments', methods=['GET'])
    @admin_required
    def get_enrollments():
        course_id = request.args.get('course_id')
        db = get_db()
        query = """
            SELECT e.*, c.title as course_title
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
        """
        params = []
        if course_id:
            query += " WHERE e.course_id=?"
            params.append(course_id)
        query += " ORDER BY e.created_at DESC"
        rows = db.execute(query, params).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows])

    @app.route('/enrollments/export', methods=['GET'])
    @admin_required
    def export_enrollments():
        from flask import Response
        db = get_db()
        rows = db.execute("""
            SELECT e.id, e.student_name, e.email, e.phone, c.title as course,
                   e.message, e.created_at
            FROM enrollments e JOIN courses c ON e.course_id = c.id
            ORDER BY e.created_at DESC
        """).fetchall()
        db.close()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID','Student Name','Email','Phone','Course','Message','Date'])
        for row in rows:
            writer.writerow([row['id'], row['student_name'], row['email'],
                             row['phone'], row['course'], row['message'], row['created_at']])
        return Response(output.getvalue(), mimetype='text/csv',
                        headers={'Content-Disposition': 'attachment; filename=enrollments.csv'})

    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})
