from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    load_dotenv()
    
    app = Flask(__name__)

    # Node.js 서버에서 오는 요청만 허용
    CORS(app, origins=['http://localhost:3000'])

    # 순환 참조 문제 방지를 위해 함수 내에서 import
    from .routes.ai import ai_bp
    app.register_blueprint(ai_bp)
    
    return app