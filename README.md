# 🎓 Rextro — Department Quiz Platform

A lightweight quiz platform for departments to create, publish and run quizzes for students and teams.

---

## Overview

Rextro is a focused web application to manage quizzes, teams and leaderboards for educational events. It provides a simple admin interface for creating quizzes and a responsive frontend for participants. This repository contains a Next.js frontend and a Node/Express backend (TypeScript).

---

## Key Features

- Team registration and management
- Timed quiz sessions with auto-submit
- Simple question bank (text / image support)
- Per-member scoring and team aggregation
- Basic anti-cheat measures (fullscreen, tab switch detection)
- Responsive Next.js frontend

---

## Architecture (high level)

Client (Next.js) ⇄ REST API (Express) ⇄ Database (MongoDB)

- Frontend: Next.js (App Router), React, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: MongoDB (planned / recommended)

---

## Technology Stack

- Frontend: Next.js + TypeScript
- Backend: Node.js (Express) + TypeScript
- Database: MongoDB (recommended)
- Styling: Tailwind CSS (optional)
- Tooling: ESLint, Prettier, Git

---

## Project Structure

- frontend/ — Next.js application (app router)
  - app/layout.tsx — Layout component
  - app/page.tsx — Landing / entry page
- backend/ — API server (Express)
- public/ — Static assets
- README.md — Project documentation

---

## Getting Started

Prerequisites:
- Node.js (v18+ recommended)
- npm
- (Optional) MongoDB Atlas

1. Install dependencies

```bash
# frontend
cd frontend
npm install

# backend
cd ../backend
npm install
```

2. Run development servers

```bash
# run frontend
cd frontend
npm run dev

# run backend
cd backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend (if used): http://localhost:5000 (default, if backend configured)

Environment variables: create .env or .env.local files in frontend/backend as needed. Keep secrets out of version control.

---

## Development

- Follow TypeScript types and run the typechecker regularly.
- Use ESLint and Prettier for style consistency.
- Add unit tests for new logic (Jest / React Testing Library recommended).

Common scripts (may vary by package.json):
- npm run dev — start dev server
- npm run build — build for production
- npm start — start production server
- npm test — run tests
- npm run lint — lint code

---

## Branching Strategy

This repository follows a simple Git branching model inspired by Git Flow and trunk-based practices to keep releases predictable and development organized.

Branches
- main
  - Production-ready code only. All releases are tagged from this branch.
- develop
  - Integration branch for completed feature work. Stable for QA and staging.
- feature/*
  - Short-lived feature branches created off `develop`.
  - Naming: feature/<short-description> (e.g., feature/team-registration)
- fix/*
  - Bugfix branches created off `develop` or `main` depending on severity.
  - Naming: fix/<short-description> (e.g., fix/login-timeout)
- hotfix/*
  - Emergency fixes created off `main` and merged back into `main` and `develop`.
  - Naming: hotfix/<short-description>
- release/*
  - Optional release branches for final stabilization before merging into `main`.
  - Naming: release/vX.Y.Z

Workflow
1. Create a feature branch from `develop` for each new task.
2. Keep branches small and focused. Commit often with clear messages.
3. Open a Pull Request (PR) from feature branch → develop.
4. Include description, related issue/identifier, and tests.
5. Use code review and automated checks (CI) before merging.
6. Merge squash or merge commit according to team preference, but keep history readable.
7. For production releases:
   - Create a `release/*` branch (optional) from `develop`, finalize, then merge to `main`.
   - Tag the merge commit on `main` (e.g., v1.2.0).
   - Merge `main` back into `develop` to keep branches synced.
8. For hotfixes:
   - Branch from `main`, fix and merge into `main`, tag the release, then merge into `develop`.

Branch naming examples
- feature/team-registration
- feature/quiz-timer
- fix/quiz-timezone
- hotfix/login-error
- release/v1.0.0

Pull Request checklist
- [ ] Branch targeted to correct base (develop or main)
- [ ] Descriptive title and summary
- [ ] Linked issue or task (if available)
- [ ] Tests added/updated
- [ ] CI passing
- [ ] Reviewer assigned

---

## Contributing

- Fork the repository and create a feature branch.
- Follow Conventional Commits for commit messages.
- Add tests for new functionality.
- Open a Pull Request to `develop` (or `main` if it's a hotfix).
- Keep contributions small and focused.

---

## License

MIT
