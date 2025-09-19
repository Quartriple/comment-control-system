from flask import Blueprint, request, jsonify
from ..models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    nickname = data.get('nickname')

    # 필수 필드 누락 검사
    if not all([username, password, nickname]):
        return jsonify({'message': 'All fields are required'}), 400
    
    # ID, 닉네임 중복 검사
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'ID already exists'}), 409
    if User.query.filter_by(nickname=nickname).first():
        return jsonify({'message': 'Nickname already exists'}), 409
    
    # 새 유저 생성
    new_user = User(username=username, password=password, nickname=nickname)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({'message': 'All fileds are required'}), 400
    
    user = User.query.filter_by(username=username).first()

    # ⚠️프로덕션 레벨에서는 해시된 비밀번호 비교.
    if user and user.password == password:
        return jsonify({'message': 'Logged in successfully'}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

    

    
