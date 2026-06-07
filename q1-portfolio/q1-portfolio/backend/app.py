from flask import Flask
from flask_cors import CORS
from database import init_db
from routes import register_routes

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['SECRET_KEY'] = 'portfolio-secret-key-change-in-prod'

    init_db()
    register_routes(app)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
