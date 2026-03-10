# Vibly Admin — 관리자 웹 대시보드

Vibly 서비스의 운영을 위한 관리자 웹입니다. 유저·커플·커뮤니티·크레딧·구독 등 전체 서비스를 모니터링하고 관리할 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| HTTP | Axios |
| 인증 | JWT 쿠키 기반 관리자 로그인 |

---

## 주요 기능

### 대시보드
- 가입자 수, 커플 수, 크레딧 사용량 등 핵심 지표 요약

### 유저 관리
- 전체 유저 목록 조회·검색
- 유저 상세 정보 확인 및 상태 변경
- 탈퇴 계정 관리

### 커플 관리
- 커플 목록 조회
- 커플 강제 해제

### 커뮤니티 관리
- 게시글·댓글 목록 조회 및 삭제
- 신고 내역 확인 및 처리

### 크레딧 & 구독 관리
- 유저별 크레딧 내역 조회
- 구독 현황 관리

### 장소 관리
- 등록된 장소 목록 및 리뷰 관리
- 체크인 현황

### 알림 & 공지
- 전체 / 특정 유저 푸시 알림 발송
- 공지사항 등록·수정·삭제

### 지원 & 로그
- 고객 문의(티켓) 처리
- 관리자 활동 로그

---

## 프로젝트 구조

```
app/
├── dashboard/
│   ├── users/          # 유저 관리
│   ├── couples/        # 커플 관리
│   ├── community/      # 커뮤니티 관리
│   ├── credits/        # 크레딧 관리
│   ├── subscriptions/  # 구독 관리
│   ├── places/         # 장소 관리
│   ├── notifications/  # 알림 발송
│   ├── reports/        # 신고 처리
│   ├── tickets/        # 고객 문의
│   ├── analytics/      # 통계
│   └── admin-logs/     # 관리자 로그
└── login/              # 관리자 로그인
```

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 NEXT_PUBLIC_API_URL 입력

# 개발 서버 실행
npm run dev
```

---

## 관련 저장소

- [Vibly](https://github.com/KOR-Giseong/Vibly) — React Native 앱
- [Vibly-backend](https://github.com/KOR-Giseong/Vibly-backend) — NestJS API 서버
