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
    - 판단 근거를 명확하게 제시하고, **사용한 정보의 출처(가장 관련성이 높은 단일 URL)**를 반드시 'source' 필드에 명시해야 합니다. 검색 결과에 URL이 없으면 빈 문자열("")을 반환하세요.

    3. **응답 형식**: 결과를 단일 JSON 객체로만 반환해야 합니다. 어떠한 추가 텍스트, 설명, 인사말도 포함하지 마세요.
    - 'hate_score': (정수, 0-100)
    - 'hate_reasoning': (문자열)
    - 'veracity': 'TRUE', 'FALSE', 'UNSURE' 중 하나
    - 'veracity_reasoning': (문자열)
    - 'topic': (문자열)
    - 'source': (문자열)
    

    4. **예시**:
    - 입력: "메시가 호날두보다 발롱 더 많이 받음 ㅋㅋ"
    - 출력:
    ```json
        {{
            "hate_score": 10,
            "hate_reasoning": "경쟁적인 스포츠 선수 비교에서 경멸적인 표현이 사용되었으나, 특정 개인이나 집단에 대한 심각한 혐오 표현은 아님.",
            "veracity": "TRUE",
            "veracity_reasoning": "리오넬 메시가 크리스티아누 호날두보다 더 많은 발롱도르를 수상한 것은 사실이다.",
            "topic": "스포츠",
            "source": "[INTERNET_LINK_OF_INFOMATION_SOURCE]"
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

@ai_bp.route('/batch-detect', methods=['POST'])
def batch_detect_hate_speech():
    data = request.get_json()
    comments_batch = data.get('comments') # [{'id': 1, 'content': '댓글 내용'}, ...] 형태
    
    if not comments_batch or not isinstance(comments_batch, list):
        return jsonify({'error': 'Comments list is missing or invalid.'}), 400
    
    # batch에 적합한 입력 형식으로 변환: { 'input': comment_content } 리스트
    langchain_inputs = []
    comment_id_map = {}

    for item in comments_batch:
        comment_id = item.get('id')
        comment_content = item.get('content')
        
        if comment_content:
            langchain_inputs.append({'input': comment_content})
            comment_id_map[len(langchain_inputs) - 1] = comment_id
    
    if not langchain_inputs:
        return jsonify({'results': []}), 200
    
    try:
        raw_results = chain.batch(langchain_inputs)
    except Exception as e:
        print(f'An error occurred during AI batch analysis: {e}')
        return jsonify({'error': 'AI batch analysis failed.'}), 500
    
    final_results = []
    
    for index, analysis_result in enumerate(raw_results):
        comment_id = comment_id_map.get(index)
        
        if not isinstance(analysis_result, dict):
            final_results.append({
                'id': comment_id,
                'status': 'FAILED',
                'error': 'AI output parsing failed.'
            })
            continue
        
        try:
            hate_score = int(analysis_result.get('hate_score', 0))
            veracity_str = analysis_result.get('veracity', 'UNSURE').upper()
            
            valid_enum_values = ['TRUE', 'FALSE', 'UNSURE']
            if veracity_str not in valid_enum_values:
                veracity_str = 'UNSURE'
                
            final_results.append({
                'id': comment_id,
                'status': 'PROCESSED',
                'hate_score': hate_score,
                'hate_reasoning': analysis_result.get('hate_reasoning', ''),
                'veracity': veracity_str,
                'veracity_reasoning': analysis_result.get('veracity_reasoning', ''),
                'source': analysis_result.get('source', ''),
                'topic': analysis_result.get('topic', ''),
                'category': analysis_result.get('category', ''),
            })
        except Exception as e:
            final_results.append({
                'id': comment_id,
                'status': 'FAILED',
                'error': f'Result formatting error: {e}'
            })
            
    return jsonify({'results': final_results}), 200

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
        
        # Node.js 백엔드 모델에 맞춰 데이터 형식 조정
        hate_score = int(result.get('hate_score', 0))
        veracity_str = result.get('veracity', 'UNSURE').upper()
        
        valid_enum_values = ['TRUE', 'FALSE', 'UNSURE']
        if veracity_str not in valid_enum_values:
            veracity_str = 'UNSURE'

        return jsonify({
            'hate_score': hate_score,
            'hate_reasoning': result.get('hate_reasoning', ''),
            'veracity': veracity_str,
            'veracity_reasoning': result.get('veracity_reasoning', ''),
            'source': result.get('source', ''),
            'topic': result.get('topic', ''),
            'category': result.get('category', '')
        }), 200

    except Exception as e:
        print(f"An error occurred during AI analysis: {e}")
        return jsonify({'error': 'AI analysis failed.'}), 500