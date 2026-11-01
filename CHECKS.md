# Implementation verification

Checked October 31, 2026 with Node.js 24.11.0 and npm 11.19.1 on Windows.

## Completed

- Starter build, TypeScript, and local HTTP 200 response.
- Production HTTP smoke checks: unconfigured `/` returns 307 to `/login`; login and app icon return 200; authenticated-page paths use private/no-store headers.
- Complete application production build and TypeScript compilation.
- ESLint with no errors or warnings; lockfile validation with `npm ci --dry-run --ignore-scripts`.
- 46 automated tests across seven files: database migration/RLS, auth actions, auth Proxy, calendar/money/recurrence, bill mutations, profile actions, and rendered states.
- Real disposable PostgreSQL execution: seed total ₱9,802.00, November unpaid rows, constraints, anonymous denial, cross-user write denial, monthly upserts, and cascading deletion.
- Seed rejection and transaction rollback with zero or multiple Auth users.
- Mocked Auth checks for credentials/errors, login/logout, expired/missing claims, and refreshed cookie propagation.
- Mutation checks for verified ownership, immutable start month, explicit payment state, invalid inputs, missing rows, and failed writes.
- Render checks for empty state, totals, overdue labels, row/menu controls, month links, and disabled unconfigured login.
- Manila midnight/month rollover, leap years, day-31 clamping, year navigation, independent payment status, centavo calculations, amount-weighted progress, and zero totals.
- Production dependency audit: no known vulnerabilities from `npm audit --omit=dev`.

## UI refresh

- Updated to a warm-white/cream and orange palette, including the logo, summary, controls, and blue Paid badges.
- Summary and bill list sit side by side at 1024px and up; smaller screens use a single column.
- Light mode is the new default. The old theme preference is reset once; the dark-mode toggle still works with a neutral/orange palette.
- Production build and all 41 existing tests pass after the refresh.
- Calculated light-mode text contrast: primary buttons 4.76:1, body text 14.64:1, muted text 4.97:1, summary labels 5.24:1.
- No database/schema changes. Local Supabase environment values were not read or changed.
- Browser visual QA remains pending because local preview access was previously denied by the browser approval gate.

## Editable greeting

- Greeting names are editable through the pencil/Add your name button, with Save/Cancel, pending state, and recoverable errors.
- Saving uses the verified account's Supabase Auth `display_name` metadata. No email fallback or schema migration is used.
- The production build (including TypeScript) and eight targeted profile-action/render tests pass. Tests cover authentication, invalid input, metadata-only updates, provider failures, and network failures.
- Real hosted name persistence/reload and browser interaction checks remain pending; browser preview access was previously denied.

## Pending

- Hosted Supabase migration/application checks with your manually created account.
- Real login, reload session persistence, actual refresh/expiry, and hosted PostgREST/RLS integration.
- End-to-end CRUD/toggles and failures against the hosted database.
- Vercel deployment and live HTTPS smoke checks.
- Visual mobile/desktop, light/dark, and keyboard/modal QA. Local browser navigation was rejected by the browser approval gate; no visual inspection is claimed.

No Supabase credentials were available during the initial implementation. The app owner subsequently configured their local environment and provided dashboard screenshots. No hosted Supabase account, database, or Vercel deployment was changed by the implementation or UI refresh.

## GitHub handoff

- Public source repository: [darreck0/bayarin](https://github.com/darreck0/bayarin), made public at the app owner's request. Supabase data remains authenticated.
- README includes light/dark dashboard screenshots, features, CMD/PowerShell setup, Supabase configuration, and links to deployment instructions.
- Full verification before upload: 46 tests, production build including TypeScript, and ESLint pass.
- Source credential scan and README image-path checks pass. `.env.local`, dependency folders, and generated builds are excluded.
- Included screenshots were supplied by the app owner. The latest dark-mode capture includes the editable greeting; the light-mode capture still predates it. A new Edge screenshot attempt was denied by the app approval gate, so no new browser automation capture is claimed.

PGlite runs disposable PostgreSQL in-process. Its test Auth schema simulates Supabase roles and JWT ownership; it does not replace hosted integration checks.

## Reproduce

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

These checks need no Supabase credentials. Follow DEPLOY.md for the remaining live checks.

## Android app — November 1, 2026

- Added an independent React Native + Expo SDK 57 project in `mobile/`, using the existing Supabase schema and Auth account. Native screens cover login, monthly bills, payment status, CRUD, editable greeting, themes, and foreground refresh.
- Mobile TypeScript, ESLint, SDK dependency validation, all 21 Expo Doctor checks, Android bundle export, and Expo Android prebuild pass locally.
- The web production build, TypeScript, and ESLint still pass. The test suite now contains 52 passing tests across eight files, including six native API tests for verified ownership, selected-month writes, one-time visibility, failed mutations, and metadata-only name changes.
- Real hosted read-only checks: Auth settings return HTTP 200; unauthenticated bill and payment requests return HTTP 401. Public sign-ups were still enabled when checked; the owner must disable **Allow new users to sign up** in Supabase Auth settings for the intended single-account setup. No hosted account or record was created or changed.
- [Android build 41293994722](https://github.com/darreck0/bayarin/actions/runs/41293994722) passed: Expo CNG/Gradle release compilation, APK Signature Scheme v2 verification, and installation/startup on an Android 15 (API 35) x86_64 emulator. The standalone app reached its login screen without Metro. Built source commit: `0c67b681a42b764795a0d2ab87f1886720c89a6d`.
- Downloaded the build artifact and verified the APK's SHA-256 checksum: `ff9c5e8928529a9c5db1589c19b7679bf8418ddc7a236eccea5f175f98c684c7`. The universal APK includes ARM64, ARMv7, x86, x86_64 native libraries and its JavaScript bundle. Visually inspected the actual emulator login screenshot included in the README.
- Published [Android v1.0.0](https://github.com/darreck0/bayarin/releases/tag/android-v1.0.0) with the APK and checksum. GitHub's uploaded asset digest matches the verified local APK.
- Public mobile configuration is supplied through ignored local environment files and Actions secrets; no service-role key is used. The private signing key is kept outside the repository and in encrypted Actions secrets.
- Fixed the vulnerable `decode-uri-component` runtime dependency with a compatible override. Remaining mobile audit findings include inherited Expo CLI/tooling dependencies; no incompatible forced dependency downgrade was applied.
- Real hosted mobile email/password login, physical-phone keyboard/layout checks, session persistence, and end-to-end authenticated CRUD still need the owner's device/account. Unit tests and an emulator login-screen check do not replace those checks.

## Mobile preview — November 2, 2026

- Added the app owner's supplied light/dark mobile dashboard image to the main README and Android guide, with links to the existing public APK release and mobile source. The attachment was copied without modification and its file hash matches.
- This documentation update does not change the app or rebuild the APK. The supplied dashboard preview is separate from the automated emulator login capture; no additional device testing is claimed.
