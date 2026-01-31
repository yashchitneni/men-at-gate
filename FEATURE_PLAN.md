# MITA Digital Platform — Feature Plan
> 🥷 Obi's overnight build plan — Jan 30, 2026

## Vision
Build the **operating system for men's communities** — starting with Austin MITA chapter, designed to be packaged and replicated for chapters nationwide. A new chapter leader should be able to onboard and have everything they need: workouts, races, member management, leaderboard, and community tools.

---

## 🏗️ TONIGHT'S BUILD ORDER

### Epic 1: Foundation & Testing (First)
**Why:** Can't ship fast without confidence. Every feature gets E2E tests.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 1.1 | **Playwright E2E setup** | `npx playwright test` runs, CI integration |
| 1.2 | **Auth flow tests** | Sign up → verify → login → see dashboard |
| 1.3 | **Landing page tests** | All sections render, CTAs work, mobile responsive |
| 1.4 | **Sentry integration** | Real DSN wired, error boundaries on all routes, source maps in CI |
| 1.5 | **Existing feature tests** | Races CRUD, Workouts CRUD, Member roster loads |

### Epic 2: Member Showcase & Spotlight ⭐
**Why:** This is your marketing page. People visit → see real men → want to join.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 2.1 | **Public member profiles** | `/men/:id` route — photo, bio, story, stats, socials |
| 2.2 | **"Why I Joined" stories** | Each member can add their transformation story |
| 2.3 | **Member spotlight on homepage** | Rotating featured member section |
| 2.4 | **Photo upload to Supabase Storage** | Members upload their own headshots in profile |
| 2.5 | **E2E: Browse roster → click member → see full profile** | |

### Epic 3: Leaderboard & Gamification 🏆
**Why:** Drives retention. Men are competitive. Make showing up visible.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 3.1 | **Points system schema** | Supabase table: `points_log` (user_id, event_type, points, date) |
| 3.2 | **Auto-award points** | Workout led (+50), Workout attended (+20), Race completed (+30), Race podium (+50) |
| 3.3 | **Leaderboard page** | `/leaderboard` — ranked list, filterable by time period (week/month/all-time) |
| 3.4 | **Profile stats** | Points total, workouts led/attended, races completed on member profile |
| 3.5 | **Badges/achievements** | "First Workout Led", "10 Races", "Streak: 4 weeks" — visual badges |
| 3.6 | **E2E: View leaderboard, filter, click through to profile** | |

### Epic 4: Chapter Architecture 🗺️
**Why:** THE unlock for scaling. Multi-tenancy from day one.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 4.1 | **`chapters` table** | id, name, city, state, logo_url, created_at, primary_color |
| 4.2 | **Members belong to chapter** | `chapter_id` on profiles, RLS scoped per chapter |
| 4.3 | **Chapter admin role** | `is_chapter_admin` — can manage their chapter's workouts, races, members |
| 4.4 | **Chapter landing page** | `/chapters/:slug` — chapter-specific hero, roster, stats |
| 4.5 | **Super admin sees all chapters** | Global dashboard for Yash/founders |
| 4.6 | **Workouts & Races scoped to chapter** | `chapter_id` on workouts, races tables |
| 4.7 | **E2E: Create chapter → add members → see scoped data** | |

### Epic 5: Workout System Polish 💪
**Why:** Core feature — make it buttery smooth.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 5.1 | **Workout templates** | Admin creates reusable templates (exercise list, duration, difficulty) |
| 5.2 | **Past workout archive** | Browse all past workouts with who led, who attended |
| 5.3 | **Attendance tracking** | Check-in system (QR code or manual) — feeds leaderboard |
| 5.4 | **Workout feedback** | Post-workout rating (1-5) + optional comment |
| 5.5 | **E2E: Full workout lifecycle — create slot → assign leader → submit → approve → attend → rate** | |

### Epic 6: Challenge System 🔥
**Why:** Time-bound engagement drivers. "30-day ruck challenge" etc.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 6.1 | **`challenges` table** | name, description, start_date, end_date, metric_type, goal |
| 6.2 | **Challenge feed** | `/challenges` — active, upcoming, completed |
| 6.3 | **Join & track progress** | Members join, log daily entries |
| 6.4 | **Challenge leaderboard** | Real-time standings within a challenge |
| 6.5 | **E2E: Create challenge → join → log entry → see standings** | |

### Epic 7: Onboarding Flow 🚪
**Why:** First impression for new members. Reduce drop-off.

| # | Task | Acceptance Criteria |
|---|------|-------------------|
| 7.1 | **Multi-step onboarding** | After signup: profile photo → bio → fitness level → goals → chapter selection |
| 7.2 | **Welcome guide** | "Here's how MITA works" walkthrough |
| 7.3 | **First workout CTA** | Immediately surface next available workout |
| 7.4 | **E2E: New user signup → complete onboarding → land on dashboard** | |

---

## 📋 PRIORITY ORDER (Tonight)

1. **Epic 1** — Foundation (Playwright + Sentry) — ~1 hour
2. **Epic 2** — Member Showcase — ~1.5 hours  
3. **Epic 3** — Leaderboard — ~2 hours
4. **Epic 5** — Workout Polish — ~1.5 hours
5. **Epic 4** — Chapter Architecture — ~2 hours (schema + migration, UI can follow)
6. **Epic 6** — Challenges — ~1.5 hours
7. **Epic 7** — Onboarding — ~1 hour

## 🔄 Build Process (Per Epic)

1. **Codex** → Deep feature planning, schema design, acceptance criteria
2. **Claude Code** → Execute the implementation
3. **Write E2E tests** alongside every feature
4. **Git branch** per epic → PR → CI passes → merge to main
5. **Vercel preview deploy** per PR for visual review

---

## 📊 SweatPals Integration Research
SweatPals has a Zapier connector with these triggers:
- **New Members** → pipe to Google Sheets
- **New Tickets** (attendance/check-ins) → pipe to Google Sheets  
- **Cancelled Members** → track churn

**Plan:** SweatPals attendance via Zapier → Google Sheets → cross-reference with MITA site emails → auto-award leaderboard points for attendance. No direct API, Zapier is the bridge.

**Strava:** Has a proper REST API. Can pull activities (runs, rucks, rides), distance, duration. Need OAuth flow for each member to connect their Strava.

**Leaderboard data sources:** Workouts attended (SweatPals), races completed (MITA site), miles ran/rucked (Strava), challenges completed (MITA site). Filter: overall, per-chapter, per-timeframe.

---

## ❓ Questions for Yash Before I Start

### Must-Answer:
1. **Points values** — Do the point amounts I suggested feel right? (50 for leading workout, 20 attending, 30 race, 50 podium)
2. **Chapter naming** — Is Austin the "flagship" chapter? What should it be called? "MITA Austin" / "Austin Chapter" / something else?
3. **Attendance tracking** — QR code scan at workouts? Or manual check-in by admin? Or self-report?

### Nice to Know:
4. **Challenges** — What's the first challenge you'd run? (Helps me design the data model right)
5. **Onboarding** — What info do you actually want from new members? Fitness level? Goals? How they heard about MITA?
6. **Workout templates** — Do you have standard workout formats or is every workout unique?

### Can Default & Iterate:
7. **Badge designs** — I'll start with text-based badges, can add visual assets later
8. **Color per chapter** — I'll default to gold (#C8A870) for Austin, make it configurable
