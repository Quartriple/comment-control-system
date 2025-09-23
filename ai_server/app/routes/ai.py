from flask import Blueprint, request, jsonify
from langchain.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser

# AI 블루프린트 생성
ai_bp = Blueprint('ai', __name__)

# LangChain 모델 설정 (제공해주신 코드)
search_tool = DuckDuckGoSearchRun(name='duckduckgo_search')
tools = [search_tool]

prompt = ChatPromptTemplate.from_messages([
    ('system', """
    당신은 주어진 댓글을 엄격하게 분석하고 평가하는 유능한 AI 시스템입니다. 당신의 임무는 두 가지입니다: 혐오 표현 분석과 내용의 진위 여부 판별.

    1. **혐오 표현 분석 기준**:
    - 혐오 표현의 종류(성별, 인종, 종교, 지역 등)와 강도를 종합적으로 고려하여 '혐오도'를 0에서 100 사이의 백분율(정수)로 환산합니다.
    - 혐오도에 대한 근거를 간결하게 설명합니다.

    2. **진위 여부 판별 기준**:
    - 댓글의 내용이 사실인지, 거짓인지, 또는 판단하기 어려운지 평가합니다.
    - 판단 근거를 명확하게 제시하고, 사용한 정보의 출처를 반드시 명시해야 합니다.

    3. **응답 형식**: 결과를 단일 JSON 객체로만 반환해야 합니다. 어떠한 추가 텍스트, 설명, 인사말도 포함하지 마세요.
    - '혐오도': (정수, 0-100)
    - '혐오도_분석': (문자열)
    - '진위여부': 'TRUE', 'FALSE', 'UNSURE' 중 하나
    - '진위여부_근거': (문자열)

    4. **예시**:
    - 입력: "메시가 호날두보다 발롱 더 많이 받음 ㅋㅋ"
    - 출력:
    ```json
        {{
            "hateful_score": 10,
            "hate_reasoning": "경쟁적인 스포츠 선수 비교에서 경멸적인 표현이 사용되었으나, 특정 개인이나 집단에 대한 심각한 혐오 표현은 아님.",
            "veracity": "TRUE",
            "veracity_reasoning": "리오넬 메시가 크리스티아누 호날두보다 더 많은 발롱도르를 수상한 것은 사실이다."
            "source": "https://www.chosun.com/sports/world-football/2023/10/31/FHDCPQ7MHVSSC2Q54NRS3R2SZM/"
        }}
    ```
    """),
    ('user', '{input}'),
    ('placeholder', '{agent_scratchpad}')
])

llm = ChatOpenAI(model='gpt-4o', temperature=0)
agent = create_tool_calling_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=False,
    handle_parsing_errors=True,
    max_iterations=10,
    max_execution_time=10
    )

chain = (
    RunnablePassthrough.assign(agent_scratchpad=lambda x: x.get('agent_scratchpad', ''))
    | agent_executor
    | (lambda x: x['output'])
    | JsonOutputParser()
)

# 댓글 분석을 처리하는 새로운 라우트
@ai_bp.route('/detect', methods=['POST'])
def detect_hate_speech():
    data = request.get_json()
    comment = data.get('comment')
    
    if not comment:
        return jsonify({'error': 'Comment content is missing.'}), 400
    
    try:
        # LangChain 모델을 호출하여 댓글 분석
        result = chain.invoke({'input': comment})
        print(result)
        
        # Node.js 백엔드 모델에 맞춰 데이터 형식 조정
        hateful_score = int(result.get('hateful_score', 0))
        is_verified_str = result.get('veracity', 'UNSURE').upper()
        
        # is_verified ENUM 값에 대한 유효성 검사 (선택 사항)
        valid_enum_values = ['TRUE', 'FALSE', 'UNSURE']
        if is_verified_str not in valid_enum_values:
            is_verified_str = 'UNSURE'

        return jsonify({
            'hateful_score': hateful_score,
            'is_verified': is_verified_str,
            'reason': result.get('veracity_reasoning', ''), # 백엔드 comments.js에 맞춤
            'topic': result.get('topic', ''),
            'category': result.get('category', '')
        }), 200

    except Exception as e:
        print(f"An error occurred during AI analysis: {e}")
        return jsonify({'error': 'AI analysis failed.'}), 500