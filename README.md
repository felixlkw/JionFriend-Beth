# Beth — 지온이의 친구

8살 여자아이 지온이를 위한 음성 기반 AI 친구.
OpenAI Realtime API (WebRTC) 로 자연스러운 한국어 음성 대화를 나누며, 대화 중에 세계사·한국사·미술사·문학사 이야기와 한·영 어휘 학습을 자연스럽게 풀어준다.

## 디렉토리 구조

```
./
├── backend/                 FastAPI + Python 3.12
│   ├── src/
│   │   ├── main.py          FastAPI 앱 + 라우팅
│   │   ├── llm.py           OpenAI Realtime ephemeral key + Whisper STT
│   │   └── prompt.py        Beth 페르소나 시스템 프롬프트
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/                React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx          단일 채팅 화면 (음성 + 자막)
│   │   ├── main.tsx
│   │   └── services/
│   │       ├── webrtc.ts    Realtime WebRTC 세션 래퍼
│   │       └── transcription.ts  Whisper STT 호출
│   └── package.json
├── Dockerfile               Multi-stage (Node + Python) Railway-ready
├── railway.json
└── README.md
```

## 로컬 실행

```bash
# 1. 환경 변수
cp backend/.env.example backend/.env
# backend/.env 에 OPENAI_API_KEY 입력

# 2. 백엔드
cd backend && pip install -r requirements.txt && cd ..

# 3. 프론트엔드 빌드
cd frontend && npm install && npm run build && cd ..

# 4. 서버 기동
cd backend && uvicorn src.main:app --host 127.0.0.1 --port 8000
```

브라우저: **http://localhost:8000/**

### 개발 모드 (HMR)

```bash
# 터미널 1 — Backend
cd backend && uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload

# 터미널 2 — Frontend
cd frontend && npm run dev
```

브라우저: **http://localhost:5173/** (Vite가 `/api` 를 `:8000` 으로 프록시)

## Railway 배포

1. `JionFriend-Beth` GitHub 레포에 푸시
2. Railway "New Project" → "Deploy from GitHub repo" → 레포 선택
3. 환경 변수: `OPENAI_API_KEY = sk-...`
4. Railway가 Dockerfile 감지 후 자동 빌드·배포
5. 도메인을 `JionFriend-Beth.up.railway.app` 으로 설정

## API

| Method | Path | 설명 |
|--------|------|------|
| GET    | `/api/health`      | Health check |
| POST   | `/api/webrtc-key`  | OpenAI Realtime ephemeral key 발급 (Beth 세션 설정 포함) |
| POST   | `/api/transcribe`  | Whisper STT (음성 → 텍스트 폴백) |
| GET    | `/`, `/{path}`     | React SPA |
