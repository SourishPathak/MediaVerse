# MediaVerse 🎞️

MediaVerse is a professional-grade media vault designed for cinema and anime enthusiasts. Built with Next.js 15 and Firebase, it provides a centralized, AI-enhanced system to archive and visualize your media consumption history.

## 🚀 Key Features

- **Cinema Archives**: High-fidelity ingestion of Letterboxd history via CSV with deterministic visual rendering.
- **Anime Protocol**: Real-time synchronization with MyAnimeList using direct OAuth2 API integration.
- **AI Monthly Wrapped**: Cinematic, story-driven recaps powered by Google Genkit (Gemini 1.5 Flash).
- **Global Indexing**: Advanced multi-parameter search and filtering across your entire media library.
- **Secure Vault**: Private access control via Firebase Authentication with session-hardened persistence.

## 🏗️ Technical Stack

- **Frontend**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS, ShadCN UI, Lucide Icons
- **Backend**: Firebase (Authentication, Cloud Firestore)
- **AI Logic**: Google Genkit, Gemini 1.5 Flash
- **Deployment**: Optimized for Vercel / Firebase App Hosting

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 20+
- A Firebase Project with Firestore and Email/Password Auth enabled.
- MyAnimeList API Client Credentials.

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_MAL_CLIENT_ID=your_mal_client_id
MAL_CLIENT_SECRET=your_mal_client_secret

GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation
```bash
npm install
npm run dev
```

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
