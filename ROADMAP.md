# CyberVault — Project Planning & Feature Roadmap

This document outlines the current technical implementation, structural decisions, and upcoming phases to build the ultimate privacy-first, cross-platform personal document space.

---

## 💎 Current Implementation (Completed)

Our architecture is optimized for **premium aesthetics, extreme responsive fluidity, and 100% free cloud execution** (no payment methods required).

### 1. Visual & UX Engine
- **Cyber-Vault Obsidian & Emerald Theme:** Clean, high-contrast dark palette tailored to feel secure and premium. Includes micro-animations and glow highlights.
- **Adaptive Responsive Layout:** The viewport automatically scales from widescreen monitors to standard tablets and small mobile phones.
- **Double Navigation System:** The app swaps from a left sidebar (desktop) to an integrated bottom tab bar (mobile/tablet ≤768px) with no layout breakage.

### 2. Cloud Gating (Firebase Auth)
- **Secure Sessions:** Email/Password and Google OAuth sign-in options.
- **Responsive Auth Cards:** Forms include interactive password-strength bars, auto-focus, validation states, and developer console logging for error codes.

### 3. Firestore Chunks Storage (Free-Tier Hack)
- **Problem Solved:** Firebase Storage now restricts the free Spark tier, demanding a paid Blaze upgrade.
- **The Workaround:** Documents are sliced into small **500KB slices** (Base64 data), saved under a subcollection in **Cloud Firestore** (100% free up to 1GB), and compiled back into standard file Blobs inside the viewer.

---

## 🚀 Upcoming Phases & Feature Planning

### 📱 Phase 1: Capacitor Native Shells (Cross-Platform)
Goal: Wrap the existing responsive Vite + React app into native containers with **zero code rewrite**.

- **Native Android Container:** Compile Gradle project, generating release APKs.
- **Native iOS Container:** Compile Xcode project, ready for local simulation or Apple Developer account testing.
- **macOS App:** Package via Capacitor Electron or Mac Catalyst container.

---

### 🛡️ Phase 2: Native Plugins Integration
Goal: Leverage native mobile APIs to improve the personal document vault experience.

- **Biometric Security (Face ID / Fingerprint):**
  - Prompt native iOS/Android biometric auth on app start or resume before opening the database.
- **Document Camera Scanner:**
  - Use the native device camera to automatically detect edges of paper documents, crop them, enhance contrast, and convert them to PDFs directly in the upload panel.
- **Native File Sharing:**
  - Use native share sheets to share documents securely to WhatsApp, Mail, or AirDrop.

---

### 🔑 Phase 3: Zero-Knowledge Client-Side Encryption
Goal: Ensure **absolute privacy**. Not even the database owner or Google can read your uploaded documents.

- **Encryption Scheme:**
  - Leverage the browser's native **Web Crypto API (AES-GCM 256-bit)**.
  - Implement a user-entered **Master Password** that never leaves the local device.
- **Flow:**
  - **Upload:** File is encrypted locally inside React → encrypted string is chunked and saved to Firestore.
  - **View:** Encrypted chunks are pulled from Firestore → decrypted locally in React memory using the Master Password → rendered in the viewer.

---

### 🧠 Phase 4: Smart Productivity (AI & Alerts)
Goal: Make the vault active and intelligent.

- **OCR Text Extraction (Tesseract.js):**
  - Run local optical character recognition on scanned images and PDFs so you can search for words *inside* the text of a receipt or contract.
- **Expiry Notifications & Reminders:**
  - Add "Expiry Date" fields for documents like passports, driving licenses, and insurance policies.
  - Schedule reminders to alert you 30 days before a document expires.
- **Encrypted Sharing Links:**
  - Generate temporary sharing links for specific documents with custom expiration times.
