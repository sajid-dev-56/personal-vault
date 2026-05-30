# Project Handoff: Personal Vault

This document is generated to provide full context to any new AI coding assistant taking over the project. 

## 1. Project Context
**Personal Vault** is a secure web and cross-platform application designed for document storage and management. It uses React with Vite for the frontend. The project is structured to support native mobile (Android/iOS) and desktop (Electron) platforms using **Capacitor**. 

## 2. Technology Stack
*   **Frontend Library:** React 18, TypeScript, Vite
*   **Primary Backend:** Supabase (for database/auth/storage)
*   **Alternative Backend:** Firebase (optional/fallback, configured via environment variables)
*   **Native Wrappers:** Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`), Electron (`@capacitor-community/electron`)
*   **Styling:** CSS (App.css, index.css, individual component CSS)
*   **Deployment:** Vercel (Web app currently deployed here)

## 3. What Has Been Completed
During the previous sessions, we achieved the following milestones:
1.  **Documentation rewritten:** Updated `README.md` to properly document local setups and the dual Supabase/Firebase architecture.
2.  **Security Remediation:** 
    *   Removed hard-coded Firebase API keys from `src/firebase.ts`.
    *   Cleaned the Git commit history of exposed secrets and force-pushed to the `main` branch.
    *   Moved secrets to `.env` variables (`VITE_FIREBASE_*`).
3.  **Web Deployment:** 
    *   Resolved a Vite build failure by adding the missing `firebase` dependency.
    *   Added Vercel CLI, configured production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), and pushed the site live.
4.  **Capacitor / Native Systems Prep:** 
    *   Configured `capacitor.config.ts` (`appId: 'com.personalvault.app'`, `webDir: 'dist'`).
    *   Installed OS-level dependencies via Homebrew: Java (`temurin` via Cask) and CocoaPods (`cocoapods`).
5.  **Android Setup:** 
    *   Successfully added the Android platform (`npx cap add android`).
    *   Built the React app (`npm run build`) and synced web assets to the native Android project (`npx cap sync android`).

## 4. Current State & Known Blockers
The web and Android platforms are fully set up. However, the iOS and Electron installations failed due to the following local machine constraints:
*   **iOS Blocker:** Needs full Xcode installed. Currently, only Xcode Command Line Tools are active. 
    *   *Error encountered:* `tool 'xcodebuild' requires Xcode...`
*   **Electron Blocker:** The `@capacitor-community/electron` script fails because the project directory (`/Users/itx.5r/Projects/Personal Vault`) contains a space.

## 5. Next Steps & Instructions to Continue

### Fixing Platform Blockers
**To the new Agent / User:**
1.  **To get Electron working:** Rename the root folder from `Personal Vault` to `Personal-Vault`. Update the workspace path, then run `npx cap add @capacitor-community/electron`.
2.  **To get iOS working:** Download full Xcode from the Mac App Store, open it to agree to terms, then run `npx cap add ios`.

### Development Roadmap
1.  **UI/UX Implementation:** Continue building out the components (`Dashboard.tsx`, `VaultList.tsx`, `DocumentViewer.tsx`, `UploadPanel.tsx`).
2.  **Auth Integration:** Wire the `AuthContext.tsx` with Supabase/Firebase logic in `AuthScreen.tsx`.
3.  **Cross-Platform Syncing:** Make sure offline functionalities are working well for mobile platforms.
4.  **Database Routing:** Finalize the logic in `src/db.ts` to seamlessly toggle between the Supabase and Firebase layers depending on the active `.env` configuration.

## 6. Project Architecture Overview
```text
src/
 ├── components/       # Core UI components (Auth, Dashboard, Sidebar, etc.)
 ├── contexts/         # React Contexts (e.g., AuthContext)
 ├── firebase.ts       # Firebase config (relies on import.meta.env variables)
 ├── db.ts             # Main abstraction layer for Database calls
 ├── main.tsx          # App entry point
 └── App.tsx           # Main application shell
```

**Note to the next AI Agent:** Please read this file to establish context before proceeding with the user's next feature request or bug fix.