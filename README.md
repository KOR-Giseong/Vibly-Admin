<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />

# 🖥️ Vibly Admin

### Vibly 서비스 관리자 대시보드

*유저·커플·커뮤니티·크레딧·구독 등 서비스 전반을 모니터링하고 운영합니다*

</div>

---

## 📦 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| UI | React 19 · Tailwind CSS 4 |
| HTTP | Axios |
| 인증 | JWT 쿠키 기반 관리자 로그인 |

---

## ✨ 주요 기능

<table>
  <tr>
    <td width="50%">
      <h3>📊 대시보드</h3>
      <ul>
        <li>가입자 수, 커플 수, 크레딧 사용량 등 핵심 지표 요약</li>
        <li>실시간 서비스 현황 모니터링</li>
      </ul>
    </td>
    <td width="50%">
      <h3>👥 유저 관리</h3>
      <ul>
        <li>전체 유저 목록 조회 및 검색</li>
        <li>유저 상세 정보 확인 및 상태 변경</li>
        <li>탈퇴 계정 관리</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>💑 커플 관리</h3>
      <ul>
        <li>커플 목록 조회</li>
        <li>커플 강제 해제</li>
      </ul>
    </td>
    <td width="50%">
      <h3>💬 커뮤니티 관리</h3>
      <ul>
        <li>게시글·댓글 목록 조회 및 삭제</li>
        <li>신고 내역 확인 및 처리</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>💳 크레딧 & 구독</h3>
      <ul>
        <li>유저별 크레딧 내역 조회</li>
        <li>구독 현황 및 결제 관리</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔔 알림 & 공지</h3>
      <ul>
        <li>전체 / 특정 유저 푸시 알림 발송</li>
        <li>공지사항 등록·수정·삭제</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📍 장소 관리</h3>
      <ul>
        <li>등록된 장소 목록 및 리뷰 관리</li>
        <li>체크인 현황</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🎫 지원 & 로그</h3>
      <ul>
        <li>고객 문의(티켓) 처리</li>
        <li>관리자 활동 로그</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📁 프로젝트 구조

```
app/
├── login/               # 관리자 로그인
└── dashboard/
    ├── page.tsx         # 메인 대시보드
    ├── users/           # 유저 관리
    ├── couples/         # 커플 관리
    ├── community/       # 커뮤니티 관리
    ├── credits/         # 크레딧 관리
    ├── subscriptions/   # 구독 관리
    ├── places/          # 장소 관리
    ├── notifications/   # 알림 발송
    ├── reports/         # 신고 처리
    ├── tickets/         # 고객 문의
    ├── analytics/       # 통계
    ├── admin-logs/      # 관리자 로그
    └── notices/         # 공지사항
```

---

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_API_URL 입력

# 3. 개발 서버 실행
npm run dev
```

---

## 🔗 관련 저장소

| 저장소 | 설명 |
|--------|------|
| [Vibly](https://github.com/KOR-Giseong/Vibly) | React Native 앱 |
| [Vibly-backend](https://github.com/KOR-Giseong/Vibly-backend) | NestJS REST API 서버 |
