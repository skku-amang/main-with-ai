# AMANG MVP - Ralph Loop 실행 계획

> **작성일**: 2026-02-04
> **목적**: AI(Ralph Loop)를 활용한 MVP 구현 계획

---

## 1. 개요

### 1.1 목표

- **MVP 범위**: 인증 + 공연/팀 관리 기능 구현
- **장비/예약**: API만 구현, 프론트엔드 UI 제외
- **방식**: 모듈별 Ralph Loop 실행 (총 3 Phase)

### 1.2 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 모노레포 도구 | pnpm workspaces만 (Turborepo 제외) |
| 완료 기준 | 빌드 + 타입체크 통과 |
| 최대 반복 | Phase당 20회 |
| DB 환경 | Docker Compose로 PostgreSQL 실행 |

---

## 2. Phase 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP 구현 Phase 구조                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: 인프라 & 공유 패키지                                   │
│  └─ 모노레포 설정, Docker, Prisma, shared-types, api-client     │
│                                                                 │
│  Phase 2: 백엔드 API (NestJS)                                   │
│  └─ 인증, 사용자, 기수/세션, 공연, 팀, 장비, 예약 모듈          │
│                                                                 │
│  Phase 3: 프론트엔드 (Next.js)                                  │
│  └─ 인증 UI, 공연/팀 UI, 회원 UI (장비/예약 UI 제외)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: 인프라 & 공유 패키지

### 3.1 생성할 구조

```
main-with-ai/
├── apps/
│   ├── api/                # 빈 NestJS 스캐폴딩
│   └── web/                # 빈 Next.js 스캐폴딩
├── packages/
│   ├── database/           # Prisma 스키마
│   ├── shared-types/       # Zod 스키마 + 타입
│   └── api-client/         # HTTP 클라이언트
├── docker-compose.yml      # PostgreSQL
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── .prettierrc
```

### 3.2 제외 항목

- `turbo.json` (Turborepo 불필요)
- `packages/eslint-config` (루트 설정으로 통합)
- `packages/typescript-config` (tsconfig.base.json으로 대체)

### 3.3 완료 조건

1. `docker compose up -d` → PostgreSQL 실행
2. `pnpm install` 성공
3. `pnpm -r db:generate` 성공
4. `pnpm -r build` 성공
5. `pnpm -r check-types` 성공

### 3.4 Ralph Loop 명령

```bash
/ralph-loop "Phase 1: 인프라 및 공유 패키지 구성. docs/ai-reconstruction 문서와 이 계획을 참조하여 모노레포 설정, Docker Compose, Prisma 스키마, shared-types, api-client를 구현하라. 완료 시 <promise>PHASE1_COMPLETE</promise> 출력." --max-iterations 20 --completion-promise "PHASE1_COMPLETE"
```

---

## 4. Phase 2: 백엔드 API

### 4.1 apps/api 구조

```
src/
├── main.ts
├── app.module.ts
├── prisma/                 # DB 연결
├── auth/                   # 인증 (JWT access/refresh)
│   ├── guards/             # AccessToken, RefreshToken, Admin
│   └── strategies/         # Passport JWT
├── users/                  # 사용자 CRUD + 프로필
├── generation/             # 기수 관리
├── session/                # 세션(악기) 관리
├── performance/            # 공연 CRUD
├── team/                   # 팀 CRUD + 지원/취소
├── equipment/              # 장비 CRUD
└── rental/                 # 예약 CRUD + 충돌 검사
```

### 4.2 구현 범위

- **인증**: 회원가입, 로그인, 토큰 갱신, 로그아웃
- **사용자**: 목록, 상세, 수정
- **기수/세션**: CRUD (관리자용)
- **공연**: CRUD + 팀 목록 조회
- **팀**: CRUD + 지원(apply) + 취소(unapply)
- **장비/예약**: CRUD + 시간 충돌 검사

### 4.3 완료 조건

1. `pnpm --filter api build` 성공
2. `pnpm --filter api check-types` 성공
3. `pnpm --filter api start:dev` → 서버 구동 (port 8000)

### 4.4 Ralph Loop 명령

```bash
/ralph-loop "Phase 2: NestJS 백엔드 API 구현. docs/ai-reconstruction 문서를 참조하여 인증, 사용자, 기수, 세션, 공연, 팀, 장비, 예약 모듈을 구현하라. 완료 시 <promise>PHASE2_COMPLETE</promise> 출력." --max-iterations 20 --completion-promise "PHASE2_COMPLETE"
```

---

## 5. Phase 3: 프론트엔드

### 5.1 apps/web 구조

```
app/
├── layout.tsx              # 루트 레이아웃
├── page.tsx                # 홈 (랜딩)
├── login/                  # 로그인
├── signup/                 # 회원가입
├── performances/           # 공연 목록
│   ├── [id]/              # 공연 상세
│   │   └── teams/         # 팀 목록
│   │       └── [teamId]/  # 팀 상세 + 지원
│   └── create/            # 공연 생성 (관리자)
├── members/                # 회원 목록
│   └── [id]/              # 회원 프로필
└── profile/                # 내 프로필

components/
├── ui/                     # shadcn/ui 컴포넌트
├── Header/                 # 내비게이션
└── Form/                   # 폼 컴포넌트
```

### 5.2 구현 범위

- **인증 UI**: 로그인, 회원가입, 로그아웃
- **공연**: 목록, 상세, 생성/수정 (관리자)
- **팀**: 목록, 상세, 생성/수정, 지원/취소
- **회원**: 목록, 프로필
- **제외**: 장비/예약 UI

### 5.3 완료 조건

1. `pnpm --filter web build` 성공
2. `pnpm --filter web check-types` 성공
3. `pnpm --filter web dev` → 개발 서버 구동 (port 3000)

### 5.4 Ralph Loop 명령

```bash
/ralph-loop "Phase 3: Next.js 프론트엔드 구현. docs/ai-reconstruction 문서를 참조하여 인증 UI, 공연/팀 UI, 회원 UI를 구현하라. 장비/예약 UI는 제외. 완료 시 <promise>PHASE3_COMPLETE</promise> 출력." --max-iterations 20 --completion-promise "PHASE3_COMPLETE"
```

---

## 6. 참조 문서

| 문서 | 용도 |
|------|------|
| DOC-001 | 프로젝트 개요 및 요구사항 |
| DOC-002 | 기술 스택 결정 |
| DOC-003 | 아키텍처 설계 |
| DOC-004 | 도메인 모델 |
| DOC-005 | 데이터베이스 스키마 |
| DOC-006 | 공유 타입 (Zod) |
| DOC-007 | API 엔드포인트 |
| DOC-008 | 인증 시스템 |
| DOC-009 | 에러 처리 |
| DOC-010 | UI/UX 설계 |
| DOC-011 | 상태 관리 & 데이터 페칭 |
| DOC-012 | 컴포넌트 라이브러리 |
| DOC-013 | 개발 환경 설정 |
