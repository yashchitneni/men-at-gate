# MITA Website Build Plan

## Context
Men In The Arena (MITA) — 501(c)(3) men's brotherhood in Austin, TX. 
Founded by Yash Chitneni, Braydon Alley, CJ Finley, Jack Lesser.
Tech: React + Vite + TypeScript + Tailwind + Shadcn + Supabase

## Current State
- Landing page with Hero, Stats, Mission/Pillars, Story timeline, Impact, GetInvolved, Vision, FAQ, Footer
- Auth system with Supabase (AuthModal, OnboardingModal)
- Member roster with mock data (unsplash stock photos)
- Races system (submit, view, join with carpool/lodging)
- Workout slots system (admin creates, members sign up to lead)
- Admin pages for workouts and members
- Calendar page (basic)
- Donate page

## What Needs Work

### Phase 1: Core Polish & Real Data (TONIGHT)
1. **Replace mock member data** — Update members.ts with real founders:
   - Yash Chitneni (Co-Founder)
   - Braydon Alley (Co-Founder)  
   - CJ Finley (Co-Founder)
   - Jack Lesser (Co-Founder)
   - Use placeholder photos but real names/roles/bios

2. **Fix homepage flow** — Clean up commented-out sections, ensure smooth scroll

3. **SEO & Meta** — Add proper meta tags, OG images, favicon

4. **Testing setup** — Add Vitest + React Testing Library + Playwright for E2E

5. **CI/CD Pipeline** — GitHub Actions for:
   - Lint + type-check on PR
   - Run tests
   - Build check
   - Preview deploy (Vercel)

6. **Error monitoring** — Add Sentry integration for the Nat Eliason workflow:
   - Sentry SDK in the app
   - Source maps upload in CI
   - Webhook to trigger issue creation

### Phase 2: Sentry → Auto-Fix Pipeline
- Sentry webhook → GitHub Issue (via Sentry integration or n8n)
- OpenClaw heartbeat picks up new issues
- Spawns coding agent to fix
- Agent creates PR with fix
- CI runs tests on PR
- Human reviews and merges

### Phase 3: Content & Features
- Real member photos from Supabase storage
- Event calendar integration
- Donation flow (Stripe)
- Blog/content section
