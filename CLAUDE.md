# CLAUDE.md - Project Guidelines for AI Assistant

## Project Overview

AMANG - 성균관대학교 밴드 동아리 관리 시스템 MVP 프로젝트

## Allowed Commands

이 프로젝트에서 Claude가 수동 확인 없이 실행할 수 있는 명령어:

```
# Package Management
pnpm install
pnpm add *
pnpm remove *
pnpm -r *

# Build & Dev
pnpm build
pnpm dev
pnpm start
pnpm start:dev

# Type Check & Lint
pnpm check-types
pnpm lint
pnpm lint:fix
pnpm format

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
npx prisma *

# Docker
docker compose *
docker *

# Git
git *

# NestJS
nest *
npx @nestjs/cli *

# Next.js
npx create-next-app *

# Testing
pnpm test
pnpm test:*
jest *

# File Operations
mkdir *
rm -rf node_modules
rm -rf dist
rm -rf .next

# General
npx *
node *
cat *
ls *
```

## Project Structure

```
main-with-ai/
├── apps/
│   ├── api/          # NestJS 백엔드
│   └── web/          # Next.js 프론트엔드
├── packages/
│   ├── database/     # Prisma
│   ├── shared-types/ # Zod 스키마
│   └── api-client/   # HTTP 클라이언트
└── docs/
    ├── ai-reconstruction/  # 재구성 문서
    └── plans/              # 실행 계획
```

## Development Guidelines

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TanStack Query, shadcn/ui
- **Backend**: NestJS 11, Passport JWT
- **Database**: PostgreSQL + Prisma
- **Validation**: Zod (shared between frontend/backend)
- **Monorepo**: pnpm workspaces (no Turborepo)

### Naming Conventions
- Files: kebab-case (e.g., `create-team.schema.ts`)
- React Components: PascalCase (e.g., `TeamForm.tsx`)
- Functions/Variables: camelCase
- Constants: SCREAMING_SNAKE_CASE

### Port Configuration
- Frontend (web): 3000
- Backend (api): 8000
- PostgreSQL: 5433

## References

상세 설계는 `docs/ai-reconstruction/` 디렉토리의 문서들을 참조:
- DOC-001 ~ DOC-015: 프로젝트 전체 명세
- docs/plans/2026-02-04-mvp-ralph-loop-plan.md: MVP 실행 계획
