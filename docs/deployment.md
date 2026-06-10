# Deployment Guide

This document outlines the professional deployment workflow for the MediaVerse ecosystem.

## Primary Target: Vercel

MediaVerse is optimized for Vercel due to its native support for Next.js 15 Server Actions and dynamic routing required for AI features.

### Steps
1. **Repository Linkage**: Connect your GitHub/GitLab repository to Vercel.
2. **Environment Variables**: Populate the "Environment Variables" section in the Vercel Dashboard with all keys from your `.env.local`.
3. **Build Settings**: Vercel will automatically detect the Next.js framework. Use the default build commands.
4. **Deploy**: Trigger the initial deployment.

## Secondary Target: Firebase App Hosting

For a fully unified Firebase experience, MediaVerse can be deployed via Firebase App Hosting.

### Steps
1. Ensure `apphosting.yaml` is present in the root directory.
2. Run `firebase apphosting:backends:create` via the Firebase CLI.
3. Link your repository and configure the backend settings.
4. Set environment secrets using `firebase apphosting:secrets:set`.

## CI/CD Workflow

The included GitHub Action (`.github/workflows/deploy.yml`) is configured for static previews or GitHub Pages deployment. Note that for Genkit AI functionality, a server-side runtime (like Vercel or App Hosting) is required.

## Security Considerations
- **Environment Secrets**: Never commit `.env` files to version control.
- **Rules Deployment**: Cloud Firestore Security Rules are managed via `firestore.rules`. Ensure these are deployed during each build cycle.
