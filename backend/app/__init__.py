from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # DB 설정
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    # 순환 참조 문제 방지를 위해 함수 내에서 import
    from .routes.auth import auth_bp

    app.register_blueprint(auth_bp)

    # DB 테이블 생성
    with app.app_context():
        db.create_all()
    
    return app