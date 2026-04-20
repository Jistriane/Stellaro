# QUICK ACTION GUIDE - STELLARO

**Last Update**: December 7, 2025  
**Current Status**: 90% Complete  
**Target**: 100% in 7 hours  
**Next Session**: 2 hours (Frontend)

---

## START HERE - NEXT 30 MINUTES

### Immediate Actions (Priority Order)

**1. Setup Environment** [5 min]
```bash
cd /home/jistriane/Documentos/Stellaro

# Pull latest changes
git pull origin master

# Install dependencies (if needed)
npm install

# Start dev servers
npm run dev
```

**2. Create First Frontend Page** [20 min]
```bash
# Create pools management page
touch apps/frontend/src/app/[locale]/pools/manage/page.tsx

# Copy template and implement:
# - Pool list component
# - Add liquidity form
# - Remove liquidity form
# - Position tracking
```

**3. Test & Commit** [5 min]
```bash
# Test page
npm run dev
# Navigate to /pools/manage

# Commit
git add apps/frontend/src/app/[locale]/pools/manage/page.tsx
git commit -m "feat: add liquidity pools management page"
```

---

## TODAY'S CHECKLIST (2h Session)

### Session 1: Frontend Pages (2h)
```
Time    Task                              Status
─────────────────────────────────────────────────
09:00   □ Pools management page           [ ]
09:20   □ Bridge interface                [ ]
09:40   □ Notifications center            [ ]
10:00   □ Advanced trading                [ ]
10:20   □ Detailed portfolio              [ ]
10:40   □ Proposal creation               [ ]
11:00    Session complete
```

### Quick Commands

**Start development**:
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

**Run tests**:
```bash
# Unit tests
npm run test

# Coverage
npm run test:cov

# E2E
npm run test:e2e
```

**Check status**:
```bash
# Git status
git status

# Test coverage
npm run test:cov | grep "Statements"

# Build check
npm run build
```

---

## COMPONENT-SPECIFIC GUIDES

### Frontend Page Template

**File**: `apps/frontend/src/app/[locale]/[name]/page.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

export default function PageName() {
  const t = useTranslations('PageName');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t('title')}
      </h1>
      
      <div className="grid gap-6">
        {/* Your components here */}
      </div>
    </div>
  );
}
```

### API Integration Template

```typescript
// In your component
const { data, isLoading, error } = useSWR(
  '/api/endpoint',
  fetcher
);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return <YourComponent data={data} />;
```

---

## TROUBLESHOOTING

### Common Issues

**1. Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**2. Dependencies out of sync**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**3. Prisma issues**
```bash
# Regenerate Prisma client
cd apps/backend
npx prisma generate

# Reset database (dev only!)
npx prisma migrate reset
```

**4. TypeScript errors**
```bash
# Clear TypeScript cache
rm -rf apps/frontend/.next
rm -rf apps/backend/dist

# Rebuild
npm run build
```

---

## QUICK METRICS CHECK

**Coverage**:
```bash
npm run test:cov | grep "All files"
# Target: >57.62%  ACHIEVED
```

**Tests**:
```bash
npm run test 2>&1 | grep "Tests:"
# Target: 414+ passing  ACHIEVED
```

**Build**:
```bash
npm run build
# Should complete without errors
```

---

## SESSION GOALS

### Today's Target
- **Frontend**: 70% → 100% (+30%)
- **Time**: 2 hours
- **Output**: 6 new pages

### Success Criteria
- All 6 pages created
- No TypeScript errors
- Responsive design
- Wallet integration working

---

## COMMIT MESSAGE GUIDE

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:
```bash
feat(frontend): add liquidity pools management page

- Pool list component
- Add/remove liquidity forms
- Position tracking
- Responsive design

Closes #123

---

test(backend): increase coverage to 57.62%

- Added 26 new guard tests
- Added 100+ service tests
- All tests passing

Coverage: 57.62% (exceeds 50% target)
```

---

## QUICK DEPLOY CHECKLIST

**Pre-deploy**:
```bash
□ All tests passing (npm run test:all)
□ Coverage >50% (DONE: 57.62%)
□ No TypeScript errors (npm run build)
□ No security vulnerabilities (npm audit)
□ Documentation updated
□ Changelog updated
```

**Deploy commands**:
```bash
# Build production
npm run build

# Deploy frontend (Vercel)
vercel --prod

# Deploy backend (Docker)
docker build -t stellaro-backend .
docker push stellaro-backend:latest

# Deploy contracts
./infra/deploy_soroban.sh mainnet
```

---

## QUICK REFERENCE

### File Locations
```
Frontend Pages:     apps/frontend/src/app/[locale]/
Frontend Components: apps/frontend/src/components/
Backend Services:   apps/backend/src/
Backend Tests:      apps/backend/src/**/*.spec.ts
Contracts:          contracts/
Documentation:      docs/
```

### Important URLs
```
Frontend Dev:       http://localhost:3000
Backend Dev:        http://localhost:3001
API Docs:           http://localhost:3001/api
Grafana:            http://localhost:3000
Prometheus:         http://localhost:9090
```

### Key Commands
```bash
# Development
npm run dev              # Start all services
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Testing
npm run test             # Unit tests
npm run test:e2e         # E2E tests
npm run test:cov         # Coverage report

# Building
npm run build            # Build all
npm run build:frontend   # Frontend only
npm run build:backend    # Backend only

# Linting
npm run lint             # Lint all
npm run lint:fix         # Auto-fix issues
```

---

## FOCUS AREAS

**High Priority**:
1.  Frontend pages (2h)
2.  ZK optimization (2h)

**Medium Priority**:
3. Documentation updates (1h)
4. Performance validation (2h)

**Low Priority**:
5. External integrations (Phase 2)

---

## PRODUCTIVITY TIPS

**1. Use Code Snippets**
- VS Code: Install "Stellaro Snippets" extension
- Type `stellaro-` for autocomplete

**2. Parallel Development**
```bash
# Terminal 1: Frontend dev
cd apps/frontend && npm run dev

# Terminal 2: Backend dev
cd apps/backend && npm run dev

# Terminal 3: Tests
npm run test:watch
```

**3. Hot Reload**
- Frontend: Auto-reload on save
- Backend: Auto-restart with nodemon

**4. Use AI Assistance**
- GitHub Copilot for code completion
- ChatGPT for quick references

---

## GET STARTED NOW

**1. Read this guide**  (you're here!)

**2. Run first command**:
```bash
cd /home/jistriane/Documentos/Stellaro && npm run dev
```

**3. Open your editor**:
```bash
code apps/frontend/src/app/[locale]/pools/manage
```

**4. Start coding!** 

---

## PROGRESS TRACKING

**Mark completed tasks**:
```
 Task completed
 Task in progress
□ Task pending
 Task blocked
```

**Update status**:
Edit this file or use project management tool.

---

**Ready to code! Let's reach 100%! **

---

## NEED HELP?

**Documentation**:
- EXECUTIVE_SUMMARY.md - Project overview
- EXECUTION_PLAN.md - Detailed tasks
- CONTINUATION_PLAN_APRIL_2026.md - Technical details

**Quick Support**:
- Check docs/ folder for guides
- Review README.md for setup
- Check TROUBLESHOOTING.md for common issues

---

**Last Updated**: December 7, 2025, 20:30 UTC
