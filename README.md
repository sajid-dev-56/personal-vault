# Personal Vault

A privacy‑first document vault that lets you sign in, upload files, and manage a searchable library with tags, categories, notes, and a clean dashboard view. Built with React + TypeScript + Vite and powered by Supabase (Auth, Storage, and Postgres).

## How It Works

- Authentication: Email/password and Google login via Supabase Auth.
- Storage: Files are uploaded to a private Supabase Storage bucket.
- Metadata: File metadata is stored in a `documents` table with row‑level security.
- Viewer: Files are retrieved and rendered in the browser (PDF/image/text preview).

## Local Setup (Supabase)

### 1) Create Supabase Project

- Create a project in Supabase.
- Create a private storage bucket named `vault-files`.

### 2) Run Database + Policies

Run the SQL in [supabase/schema.sql](supabase/schema.sql) using the Supabase SQL editor.

### 3) Enable Auth Providers

- Enable Email/Password.
- Enable Google OAuth.
- Add redirect URLs (dev):
  - `http://localhost:5173`
  - `http://localhost:5174`

### 4) Add Environment Variables

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# or
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### 5) Install and Run

```bash
npm install
npm run dev
```

## Firebase Setup (Optional)

If you prefer Firebase, you can configure it as an alternative backend. This project currently targets Supabase, so switching back requires wiring the Firebase SDK into the auth and data layers.

High‑level steps:

1. Create a Firebase project.
2. Enable Email/Password and Google in Authentication.
3. Enable Firestore and Storage.
4. Apply rules from `firestore.rules` and `storage.rules`.
5. Add Firebase env variables to `.env.local`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

6. Replace Supabase calls with Firebase SDK calls in the auth context and data helpers.

## Notes

- The upload path supports large files (up to 500MB), subject to your storage plan limits.
- Keep `.env.local` private and never commit it.
