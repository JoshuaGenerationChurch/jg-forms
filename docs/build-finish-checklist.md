# Build Finish Checklist

## Scope
- [x] Fix TypeScript baseline (`npm run types` must pass)
- [x] Harden admin access rules (no implicit admin when config is empty)
- [x] Add stronger server-side validation for public Work Request submissions
- [x] Queue email dispatch for form notifications
- [x] Consolidate legacy/duplicate routes and pages
- [x] Replace dashboard placeholders with useful form metrics
- [x] Wire Contact us to a real route/page (non-admin/public)
- [x] Run full verification (`npm run lint`, `npm run types`, `php artisan test`)

## SMTP / Email Flow Scope
- [x] Add mail health-check command with optional live test send
- [x] Build functional Contact us submission flow (store + queued notifications)
- [x] Run verification after SMTP/contact patches (`npm run lint`, `npm run types`, `php artisan test`)

## Queue Hardening Scope
- [x] Add queue health-check command for production backlog/failed monitoring
- [x] Add production queue operations runbook (Supervisor/systemd + incident flow)
- [x] Verify queue hardening + sidebar trigger patch (`npm run lint`, `npm run types`, `php artisan test`)

## Roles and Access Scope
- [x] Replace env email-based admin checks with Spatie permissions
- [x] Add invite-only registration flow for admin/future role users
- [x] Add role bootstrap command and operational docs
- [x] Verify role/invite changes (`npm run lint`, `npm run types`, `php artisan test`)

## Progress Log
- 2026-03-03: Checklist created.
- 2026-03-03: Fixed TypeScript baseline issues across holiday forms, WebAuthn utilities, passkeys breadcrumb typing, Google Maps typing, and Work Request submit payload typing. `npm run types` now passes.
- 2026-03-03: Hardened admin access to require explicit `WORK_FORMS_ADMIN_EMAILS` membership and added regression test coverage.
- 2026-03-03: Added backend Work Request payload validation (core conditional checks + terms acceptance) and added rejection test coverage.
- 2026-03-03: Switched form notification emails to queued dispatch and updated mail assertions in tests.
- 2026-03-03: Consolidated legacy entries flow by removing old `/work-request/entries` authenticated pages, routes, and tests.
- 2026-03-03: Replaced dashboard placeholder cards with live form metrics, form summaries, and recent entry reporting.
- 2026-03-03: Added a real public `/contact-us` page and wired global header/footer `Contact us` links to it.
- 2026-03-03: Completed verification run. `npm run lint`, `npm run types`, and `php artisan test` all passed.
- 2026-03-03: Added `mail:health-check` artisan command and SMTP verification documentation.
- 2026-03-03: Upgraded Contact us page from placeholder to real submission flow with persistence + queued email notifications.
- 2026-03-03: Completed SMTP/contact patch verification. `npm run lint`, `npm run types`, and `php artisan test` all passed.
- 2026-03-04: Ran focused step-2 smoke tests for `work-request` and `contact-us` only. `tests/Feature/WorkRequest/PublicWorkRequestFormTest.php` and `tests/Feature/ContactUsSubmissionTest.php` both passed (5 tests, 38 assertions).
- 2026-03-04: Added `queue:health-check` artisan command and production queue runbook with Supervisor/systemd examples.
- 2026-03-04: Restored a visible sidebar expand/collapse trigger on the admin dashboard page without reintroducing the old top header bar.
- 2026-03-04: Verified queue hardening + sidebar trigger changes. `npm run lint`, `npm run types`, and `php artisan test` all passed.
- 2026-03-04: Replaced admin access checks with Spatie permissions and removed dependency on `WORK_FORMS_ADMIN_EMAILS`.
- 2026-03-04: Completed invite-only registration flow (invitation token validation, invited email match, and role assignment on signup).
- 2026-03-04: Added `workforms:grant-role` command and role/invitation operations guide in `docs/roles-and-invitations.md`.
- 2026-03-04: Verified role/invite refactor. `npm run lint`, `npm run types`, and `php artisan test` all passed.
