## Project Comment Control System
A system to detect and control hateful comments using a backend server and a separate AI server.

---

### 🇰🇷 프로젝트 개요

본 프로젝트는 **혐오 표현 감지 시스템**을 구축하는 것을 목표로 합니다. 사용자 댓글을 Node.js 기반의 백엔드 서버가 수집하고, 이를 Python Flask 기반의 AI 서버로 전송하여 혐오 표현을 판별합니다. 판별 결과에 따라 댓글을 데이터베이스에 저장하고, 사용자가 결과를 확인할 수 있도록 하는 시스템입니다.

### 🇺🇸 Project Overview

This project aims to build a **Hate Speech Detection System**. A Node.js backend server collects user comments and sends them to a Python Flask-based AI server for hate speech detection. Based on the detection results, comments are saved to a database and can be displayed to the user.

---

### 🇰🇷 기술적 접근법

프로젝트는 모놀리식 아키텍처 대신 백엔드와 AI 서버를 분리하여 서비스 간의 결합도를 낮추고 각 모듈의 독립성을 확보했습니다.

* **백엔드 서버 (Node.js)**:
    * **프레임워크**: Express.js
    * **데이터베이스**: SQLite (`project.db` 파일에 저장)
    * **ORM**: Sequelize
    * **뷰 엔진**: EJS
    * **프로세스 관리**: PM2
    * **API**: `/comments` 엔드포인트를 통해 댓글을 제출하고 조회합니다. Flask 서버에 HTTP 요청을 보내 댓글의 혐오 표현 여부를 판별합니다.

* **AI 서버 (Python)**:
    * **프레임워크**: Flask
    * **라이브러리**: `langchain`, `openai`, `numpy` 등 AI/ML 관련 라이브러리
    * **API**: `/detect` 엔드포인트에서 임시로 '혐오'라는 단어가 포함된 댓글을 혐오 표현으로 판별합니다.

### 🇺🇸 Technical Approach

The project adopts a decoupled architecture by separating the backend and AI servers, ensuring lower coupling between services and the independence of each module.

* **Backend Server (Node.js)**:
    * **Framework**: Express.js
    * **Database**: SQLite (stored in a `project.db` file)
    * **ORM**: Sequelize
    * **View Engine**: EJS
    * **Process Management**: PM2
    * **API**: Submits and retrieves comments via the `/comments` endpoint. It sends an HTTP request to the Flask server to determine if a comment contains hate speech.

* **AI Server (Python)**:
    * **Framework**: Flask
    * **Libraries**: Includes AI/ML-related libraries like `langchain`, `openai`, and `numpy`
    * **API**: The `/detect` endpoint temporarily identifies any comment containing the word "혐오" (hate) as hateful.

---

### 🇰🇷 파일 구조 (File System Structure)

* `backend/`: Node.js 서버 및 웹 애플리케이션 관련 코드가 포함됩니다.
* `ai_server/`: Python Flask 기반 AI 서버 코드가 포함됩니다.
* `ecosystem.config.js`: PM2 프로세스 매니저 설정 파일입니다.
* `.gitignore`: Git 버전 관리에서 제외할 파일 목록입니다.

---

### License
* **MIT**