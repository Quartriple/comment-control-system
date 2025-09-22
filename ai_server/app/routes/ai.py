from flask import Blueprint, request, jsonify

# AI 블루프린트 생성
ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/detect', methods=['POST'])
def detect_hate_speech():
    data = request.get_json()
    comment = data.get('comment')

    # 임시 응답
    if "혐오" in comment:
        return jsonify({'is_hateful': True, 'reason': '혐오 표현입니다.'}), 200
    else:
        return jsonify({'is_hateful': False, 'reason': '정상적인 표현입니다.'}), 200