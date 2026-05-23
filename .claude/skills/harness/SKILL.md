---
name: harness
description: Beth(베스) — 8세 지온이용 AI 친구 — 프로젝트의 전문가 subagent 하네스를 오케스트레이션. persona/history/voice/safety/ux/fullstack 6명 에이전트를 요청에 맞춰 단일·병렬로 호출. 사용자가 /harness 또는 "전문가 하네스 써줘", "베스 하네스 돌려줘" 라고 할 때.
---

# Harness — Beth 전문가 오케스트레이션

이 skill은 Beth 프로젝트의 작업 요청을 받았을 때, 적절한 전문가 subagent로 분배하는 방법을 안내한다.

## 에이전트 카탈로그

### Voice & Content
- **persona-copywriter** — Beth 말투·톤·대사·페르소나 섹션 카피 (opus)
- **history-literacy-curator** — 세계사·한국사·미술사·문학사 일화 큐레이션 + 한·영 어휘 설명 (opus)

### Tech
- **realtime-voice-engineer** — OpenAI Realtime + WebRTC + Whisper 음성 파이프라인 (sonnet)
- **kid-ux-designer** — 8세 친화 UI (색·버튼·애니메이션·자막) (sonnet)
- **fullstack-dev** — FastAPI·React·Vite·Dockerfile·Railway 일반 개발 (sonnet)

### Guard
- **child-safety-guardrail** — 콘텐츠 안전·prompt injection·위험 신호 감지·법적 준수 (opus)

## 라우팅 가이드 (요청 유형 → 호출 패턴)

| 요청 | 호출 패턴 |
|---|---|
| "베스 말투 어색해 / 인사·작별 대사 다듬어줘" | persona-copywriter 단독 |
| "역사 일화 추가 / 사실 검증" | history-literacy-curator 단독 |
| "한·영 단어 설명 예시 짜줘" | history-literacy-curator 단독 |
| **"시스템 프롬프트 본격 튜닝"** (페르소나+역사+안전 동시) | persona-copywriter + history-literacy-curator + child-safety-guardrail **병렬** → 메인이 머지 |
| "음성이 끊겨 / 지연 / 너무 빨라" | realtime-voice-engineer 단독 |
| "voice 톤 후보 비교 / 음성 파라미터 튜닝" | realtime-voice-engineer 단독 |
| "voice를 다른 걸로 바꿔보자" | realtime-voice-engineer + persona-copywriter **순차** (voice 변경 후 카피 톤 재검토) |
| "UI 색감 / 버튼 / 자막 / 애니메이션" | kid-ux-designer 단독 |
| "UI 안내 문구 다듬기" | kid-ux-designer + persona-copywriter **병렬** |
| "지온이가 위험한 말 했을 때 대응 / 안전 가드 강화" | child-safety-guardrail 단독 → 카피는 persona-copywriter에 핑퐁 |
| "새 기능 추가 안전 검토" | child-safety-guardrail 단독 (Go/No-Go 판단) |
| "새 API 엔드포인트 / 의존성 추가" | fullstack-dev 단독 |
| "Railway 빌드 실패 / Dockerfile 이슈 / env 처리" | fullstack-dev 단독 |
| "새 페이지 추가 (UI + 라우팅)" | kid-ux-designer + fullstack-dev **순차** (디자인 → 구현) |

## 호출 원칙

1. **단일로 충분하면 단일** — 과한 분배는 컨텍스트 낭비.
2. **독립적이면 병렬** — `Agent` 도구를 단일 메시지에 여러 번 호출해서 동시 실행.
3. **종속적이면 순차** — 한 에이전트 출력이 다음 에이전트 입력일 때 (예: voice 변경 → 카피 재검토).
4. **페르소나·역사·안전 3축은 항상 같이 흔들림** — 시스템 프롬프트 큰 변경은 세 명 병렬 → 메인이 머지하는 패턴이 기본.
5. **child-safety-guardrail은 거부권 보유** — 위 5명이 합의해도 안전 가드 거부 시 Go 보류.

## 도메인 경계 메모

- **`backend/src/prompt.py`** — 세 페르소나·역사·안전 에이전트의 공동 영역. 한 명만 부르지 말 것. 전체 튜닝은 항상 셋 병렬.
- **`backend/src/llm.py`** — voice/turn_detection/temperature 같은 음성 파라미터는 realtime-voice-engineer. 단, temperature 0.9 초과는 child-safety-guardrail 협의.
- **`frontend/src/App.tsx`** — 시각·인터랙션은 kid-ux-designer, 상태관리·라우팅은 fullstack-dev. `STATUS_TEXT` 같은 안내 문구는 designer + persona-copywriter 병렬.
- **`frontend/src/services/webrtc.ts`** — 100% realtime-voice-engineer.

## 이 skill을 호출했을 때

사용자 요청을 위 라우팅 표와 매칭해서 **어떤 에이전트(들)을 호출할지 한 문장으로 선언**한 뒤 즉시 `Agent` 도구 호출. 라우팅이 모호하면 사용자에게 짧게 확인.

병렬 호출 시: 단일 메시지에 여러 `Agent` 호출 블록을 넣는다.
순차 호출 시: 첫 에이전트 결과 받은 뒤 다음을 호출한다.
