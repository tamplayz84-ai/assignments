from flask import request, jsonify, session
import hashlib
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
        username = data.get('username', '')
        password = hashlib.sha256(data.get('password', '').encode()).hexdigest()
        db = get_db()
        user = db.execute(
            "SELECT * FROM admin_users WHERE username=? AND password=?",
            (username, password)
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

    # ── PROJECTS ──────────────────────────────────────────────────
    @app.route('/projects', methods=['GET'])
    def get_projects():
        db = get_db()
        rows = db.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
        db.close()
        return jsonify([dict(r) for r in rows])

    @app.route('/projects', methods=['POST'])
    @admin_required
    def add_project():
        data = request.get_json()
        db = get_db()
        db.execute(
            "INSERT INTO projects (title, description, technologies, github_link, live_link) VALUES (?,?,?,?,?)",
            (data['title'], data['description'], data['technologies'],
             data.get('github_link', ''), data.get('live_link', ''))
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Project added'}), 201

    @app.route('/projects/<int:pid>', methods=['PUT'])
    @admin_required
    def update_project(pid):
        data = request.get_json()
        db = get_db()
        db.execute(
            "UPDATE projects SET title=?, description=?, technologies=?, github_link=?, live_link=? WHERE id=?",
            (data['title'], data['description'], data['technologies'],
             data.get('github_link', ''), data.get('live_link', ''), pid)
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Project updated'})

    @app.route('/projects/<int:pid>', methods=['DELETE'])
    @admin_required
    def delete_project(pid):
        db = get_db()
        db.execute("DELETE FROM projects WHERE id=?", (pid,))
        db.commit()
        db.close()
        return jsonify({'message': 'Project deleted'})

    # ── CONTACT ───────────────────────────────────────────────────
    @app.route('/contact', methods=['POST'])
    def contact():
        data = request.get_json()
        db = get_db()
        db.execute(
            "INSERT INTO messages (name, email, subject, message) VALUES (?,?,?,?)",
            (data['name'], data['email'], data['subject'], data['message'])
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Message received. Thank you!'}), 201

    @app.route('/messages', methods=['GET'])
    @admin_required
    def get_messages():
        db = get_db()
        rows = db.execute("SELECT * FROM messages ORDER BY created_at DESC").fetchall()
        db.close()
        return jsonify([dict(r) for r in rows])

    @app.route('/messages/<int:mid>', methods=['DELETE'])
    @admin_required
    def delete_message(mid):
        db = get_db()
        db.execute("DELETE FROM messages WHERE id=?", (mid,))
        db.commit()
        db.close()
        return jsonify({'message': 'Message deleted'})

    # ── HEALTH ────────────────────────────────────────────────────
    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})
