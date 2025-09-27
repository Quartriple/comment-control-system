## 프로젝트: 댓글 제어 시스템 (Project Comment Control System)

AI를 활용하여 혐오 표현 댓글을 탐지하고 제어하는 시스템입니다. 백엔드 서버와 별도의 AI 서버로 구성되어 있습니다.

---

### 🇰🇷 프로젝트 개요

본 프로젝트는 **혐오 표현 감지 시스템** 구축을 목표로 합니다. Node.js 기반의 백엔드 서버가 사용자 댓글을 수집하고, 주기적으로 Python Flask 기반의 AI 서버로 전송하여 혐오 표현을 일괄 판별합니다. 판별 결과에 따라 댓글을 데이터베이스에 저장하고, 사용자가 결과를 확인할 수 있도록 하는 시스템입니다.

### 🇺🇸 Project Overview

This project aims to build a **Hate Speech Detection System**. A Node.js backend server collects user comments and periodically sends them to a Python Flask-based AI server for batch hate speech detection. Based on the detection results, comments are saved to a database and can be displayed to the user.

---

### 🇰🇷 주요 기능

* **게시물 및 댓글 관리**: 사용자는 게시물을 작성, 조회, 수정, 삭제할 수 있으며, 각 게시물에 댓글을 작성할 수 있습니다.
* **사용자 인증**: `bcrypt`를 이용한 암호화와 세션 기반의 회원가입 및 로그인 기능을 통해 사용자별 활동을 관리합니다.
* **혐오 표현 탐지**: AI 서버가 댓글 내용을 분석하여 혐오 표현 점수, 진위 여부, 주제 등을 판별합니다.
* **비동기 일괄 처리**: `node-cron` 스케줄러를 통해 **배치(batch) 처리** 방식으로 댓글 분석을 비동기적으로 수행하여 사용자 경험을 저해하지 않고 AI 서버의 부하를 관리합니다.
* **관리자 대시보드**: 관리자는 모든 게시물과 댓글을 모니터링하고 관리할 수 있는 별도의 대시보드를 제공받습니다.

### 🇺🇸 Key Features

* **Post and Comment Management**: Users can create, read, update, and delete posts, and write comments on each post.
* **User Authentication**: Manages user activities through sign-up and login functionalities based on sessions and encryption using `bcrypt`.
* **Hate Speech Detection**: The AI server analyzes comment content to determine a hate speech score, veracity, topic, etc.
* **Asynchronous Batch Processing**: Comment analysis is handled asynchronously as a **batch process** using a `node-cron` scheduler, managing the AI server's load without disrupting the user experience.
* **Admin Dashboard**: Administrators are provided with a separate dashboard to monitor and manage all posts and comments.

---

### 🇰🇷 시스템 아키텍처 및 기술적 접근법

프로젝트는 모놀리식 아키텍처 대신 백엔드와 AI 서버를 분리하여 서비스 간의 결합도를 낮추고 각 모듈의 독립성을 확보했습니다.

* **백엔드 서버 (Node.js)**:
    * **프레임워크**: Express.js
    * **데이터베이스**: SQLite (`project.db` 파일에 저장)
    * **ORM**: Sequelize
    * **뷰 엔진**: EJS
    * **프로세스 관리**: PM2
    * **모듈**: `bcrypt` (비밀번호 암호화), `express-session` (세션 관리), `node-cron` (스케줄링) 등
    * **API**: `/comments` 엔드포인트를 통해 댓글을 제출하고 조회합니다. 스케줄러가 주기적으로 Flask 서버의 `/batch-detect` API를 호출하여 댓글 분석을 요청합니다.

* **AI 서버 (Python)**:
    * **프레임워크**: Flask
    * **핵심 라이브러리**: `langchain`, `openai` (LLM 연동), `DuckDuckGoSearchRun` (웹 검색)
    * **API**: `/batch-detect` 엔드포인트를 통해 여러 댓글을 일괄 처리하는 기능을 제공합니다.

### 🇺🇸 System Architecture & Technical Approach

The project adopts a decoupled architecture by separating the backend and AI servers, ensuring lower coupling between services and the independence of each module.

* **Backend Server (Node.js)**:
    * **Framework**: Express.js
    * **Database**: SQLite (stored in a `project.db` file)
    * **ORM**: Sequelize
    * **View Engine**: EJS
    * **Process Management**: PM2
    * **Modules**: `bcrypt` (password encryption), `express-session` (session management), `node-cron` (scheduling), etc.
    * **API**: Submits and retrieves comments via the `/comments` endpoint. The scheduler periodically calls the `/batch-detect` API of the Flask server to request comment analysis.

* **AI Server (Python)**:
    * **Framework**: Flask
    * **Core Libraries**: `langchain`, `openai` (for LLM integration), `DuckDuckGoSearchRun` (for web searches).
    * **API**: The `/batch-detect` endpoint provides a feature to process multiple comments in a batch.

---

### 🇰🇷 파일 구조 및 주요 파일 설명

* `backend/`: Node.js 서버 및 웹 애플리케이션 관련 코드가 포함됩니다.
* `ai_server/`: Python Flask 기반 AI 서버 코드가 포함됩니다.
    * `requirements.txt`: AI 서버 실행에 필요한 Python 라이브러리 목록입니다. `pip install -r requirements.txt` 명령어로 설치할 수 있습니다.
* `ecosystem.config.js`: PM2 프로세스 매니저 설정 파일입니다. `pm2 start ecosystem.config.js` 명령어로 백엔드 서버를 실행하고 관리할 수 있습니다.
* `.gitignore`: Git 버전 관리에서 제외할 파일 목록입니다 (예: `node_modules`, `.env`).

### 🇺🇸 File Structure & Key File Descriptions

* `backend/`: Contains the Node.js server and web application code.
* `ai_server/`: Contains the Python Flask-based AI server code.
    * `requirements.txt`: A list of Python libraries required to run the AI server. You can install them using the command `pip install -r requirements.txt`.
* `ecosystem.config.js`: The configuration file for the PM2 process manager. You can start and manage the backend server with the command `pm2 start ecosystem.config.js`.
* `.gitignore`: A list of files to be excluded from Git version control (e.g., `node_modules`, `.env`).

---

### License

* **MIT**