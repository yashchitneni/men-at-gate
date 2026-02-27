# SweatPals Endpoints + Reconciliation Deep Dive

## Purpose
This doc defines how Men in the Arena (MITA) should handle:
1. People who register/check in on SweatPals first.
2. People who use MITA first and have no SweatPals linkage yet.
3. People who exist in both systems but are not linked.

It also catalogs the currently used SweatPals public endpoints and MITA internal integration actions.

## External SweatPals Endpoints Currently Used
These are the external public endpoints already used by `supabase/functions/sweatpals-sync/index.ts`.

1. `GET https://ilove.sweatpals.com/api/users/username/{communityUsername}`
2. `POST https://ilove.sweatpals.com/api/events/public/search`
3. `GET https://ilove.sweatpals.com/api/files/{fileId}?variant={variant}`

Notes:
1. These power schedule discovery and event image URL construction.
2. They are treated as best-effort public API usage and should be monitored for response shape drift.

## MITA Internal Edge Actions (`sweatpals-sync`)
### Public-read actions
1. `public_schedule`
2. `public_next_workout`

### Admin/system actions
1. `health`
2. `ingest`
3. `sync_schedule`
4. `test_ingest`
5. `replay`
6. `list_unmapped`
7. `list_mappings`
8. `save_mapping`
9. `cleanup_errors`

### Member-auth actions (new)
1. `identity_status`
2. `claim_identity`

## Identity and Attendance Data Model
Relevant tables:
1. `external_member_identities`
2. `external_events`
3. `event_attendance_facts`
4. `external_identity_link_events` (audit trail)
5. `integration_ingestion_runs` (ops telemetry)

Relevant linking function:
1. `claim_sweatpals_identity_for_profile(profile_id, provider)`

## Canonical Rules
1. Source of truth for registration and attendance: SweatPals.
2. Canonical identity auto-link key: exact email match (normalized lower-case).
3. Conservative auto-linking only.
4. Attendance counted in leaderboard: `checked_in` only.
5. Initial historical backfill target: 90 days.

## Scenario Matrix
### A) SweatPals-first user, no MITA account yet
1. Webhook ingest creates external identity and attendance facts.
2. Records remain unlinked until MITA profile exists.
3. When user signs in with matching email, they can run `claim_identity` and link historical activity.

### B) MITA-first user, no SweatPals usage yet
1. MITA profile remains unlinked.
2. Profile page shows SweatPals connection status and guidance.
3. No forced blocking in workouts flow.

### C) User exists in both but unlinked
1. `identity_status` detects unlinked matchable identities by email.
2. Prompt appears after login and on Profile page.
3. `claim_identity` links identities and backfills `member_id` onto events/facts.
4. Rollups refresh after linking.

## UX Surfaces
1. Profile page:
   - "SweatPals Connection" card with status.
   - "Connect SweatPals Activity" button when matchable records exist.
2. Post-login prompt:
   - Non-blocking prompt when unlinked matchable records are detected.
3. Workouts/Calendar:
   - No mandatory linking prompt.

## Rollout Checklist
1. Apply migration for `external_identity_link_events` and claim RPC.
2. Deploy updated `sweatpals-sync` edge function.
3. Verify `identity_status` and `claim_identity` using authenticated account.
4. Validate profile connection card behavior.
5. Run 90-day replay/backfill and verify rollup deltas.

## Operational Monitoring
Track in admin:
1. Unlinked identity count.
2. New link events/day.
3. Ingestion errors and unmapped event counts.
4. Last schedule sync and last webhook run.

