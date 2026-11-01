# Bayarin for Android

React Native + Expo version of Bayarin. It uses the **same Supabase project, account, bills, payments, and display name** as the web app. No new database migration is needed for an existing Bayarin project.

## Install on your phone

1. Open the [Android release](https://github.com/darreck0/bayarin/releases/tag/android-v1.0.0) on your Android phone.
2. Download **Bayarin-1.0.0.apk** from **Assets**.
3. Open the downloaded file and approve installation from your browser/file manager if Android requests it.
4. Open **Bayarin** and log in with the same email/password you use on the website.

The standalone APK includes its JavaScript bundle and **does not need your laptop, Metro, Expo Go, or Vercel running**. Internet is needed for Supabase login and saving records.

Keep **Allow new users to sign up** disabled in Supabase **Authentication → Sign In / Providers** for the intended single-account setup. The app only offers login; account creation is controlled separately by [Supabase Auth configuration](https://supabase.com/docs/guides/auth/general-configuration).

Supported features:

- Monthly bill navigation and due-date sorting.
- Total, Paid, Remaining, and amount-weighted payment progress.
- Tap to mark paid/unpaid, independently per month.
- Add/edit/delete bills, with monthly recurrence or one-time occurrences.
- Manila overdue calculation and short-month due-day clamping.
- Editable greeting name saved to the same Supabase account.
- Light/dark mode saved on the phone.
- Persistent login, foreground token refresh, pull-to-refresh, and reload after returning to the app.

Name/bill edits apply across applicable months, as in the web version. Deletion removes all occurrences and payment history after confirmation. Signing out of the phone uses local session scope, so it does not sign out the website.

## Run with Expo Go

The project uses **Expo SDK 57**, matching the physical-device Expo Go version supported during the SDK 58 transition.

```sh
cd mobile
npm ci
```

Copy `.env.example` to `.env.local` and enter your existing project's public configuration:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

For this prepared laptop checkout, `.env.local` has already been created from the web app's public configuration. It is not committed.

```sh
npx expo start --lan
```

Install **Expo Go** from Google Play. Keep the laptop and phone on the same Wi-Fi, then scan the QR code from Expo Go. Development through Expo Go needs the laptop server running; the standalone APK does not.

## Build a new APK

### GitHub Actions build

The [Build Android APK workflow](../.github/workflows/android-apk.yml) runs for mobile source changes or manually through **Actions → Build Android APK → Run workflow**.

It installs dependencies, checks TypeScript/configuration, generates Android through Expo CNG, builds a signed standalone release APK, verifies the signature, and installs/launches it on an Android emulator. The workflow artifact contains the APK, SHA-256 checksum, and login-screen smoke-test evidence.

Changes to Markdown documentation do not rebuild the APK. Code/configuration changes do; increase `android.versionCode` and the app version for a new published release.

These repository Actions secrets supply build-time configuration:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `BAYARIN_ANDROID_KEYSTORE_BASE64`
- `BAYARIN_ANDROID_STORE_PASSWORD`

The signing key is stable across builds so an APK can update the existing installation. Keep the signing secrets; never commit a keystore or password. The Supabase publishable key is bundled in the app by design; RLS and the user's authenticated token protect records. No secret/service-role key is bundled.

### EAS alternative

With an Expo account, configure the same public environment values and run:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` defines an APK preview profile. To update an APK originally signed by the GitHub workflow, import that same signing key into EAS first; a different key requires uninstalling the old app before installing the new one.

## Verify locally

```sh
npm run typecheck
npm run lint
npm run check:config
npx expo install --check
npx expo-doctor
npm run export:android
```

Shared bill/calendar/money helpers are copied from the web project's pure modules with relative imports. Keep both sets in sync when changing billing rules. Mobile data access is native Supabase client code; it does not call Next.js Server Actions or embed a WebView.

Source layout:

```text
mobile/
  src/app/          Expo Router login and dashboard screens
  src/components/   Native controls, bill editor, and name editor
  src/context/      Persistent session and theme providers
  src/lib/          Typed Supabase client, data API, and billing helpers
  plugins/          Android signing configuration through Expo CNG
  scripts/          Public-configuration check and emulator smoke test
  assets/           Bayarin icons
  app.json          App identity and native configuration
  eas.json          EAS APK build profile
```
