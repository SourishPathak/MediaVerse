# **App Name**: MediaVerse

## Core Features:

- Fortified Google Auth: Industry-standard Google OAuth2 integration via Supabase, utilizing secure session handling and protected environment variables to prevent unauthorized access.
- Secure Data Vault: A hardened PostgreSQL schema implementation using Row Level Security (RLS) to ensure that media data is never publicly accessible and only visible to the authenticated owner.
- Omni-Import Engine: A secure ingestion service to parse Letterboxd CSV and MAL XML exports, sanitizing all metadata before persisting it to the private database.
- Gemini Narrative Wrapped: A generative AI feature that uses a reasoning tool to analyze your monthly activity and craft a personalized story about your taste profile.
- Glass-Morph Unified Dashboard: A visual-heavy control center showing total hours watched, top genres, and yearly progress using a semi-transparent blur aesthetic.
- Pro-Mark Review Editor: Full-screen rich text editor with Markdown support for writing and saving review drafts locally before publishing.
- Global Instant Search: Lightning-fast filtering system to query across anime and movie titles, release years, and personal ratings in a single input.

## Style Guidelines:

- The palette is centered on a Deep Abyss background (#141116) to maximize contrast, featuring a Vibrant Orchid primary color (#BE7BF1) and a Radiant Indigo accent (#7B84F1).
- Font pairing: 'Space Grotesk' for bold, technical headlines and 'Inter' for clean, machine-neutral body text and metadata.
- Use minimalist line-weight icons with subtle glows to maintain the high-end digital agency aesthetic.
- Android-first glassmorphism design featuring stacked card layers, heavy backdrop blurs, and wide horizontal padding.
- Liquid-smooth spring transitions between dashboard widgets and satisfying micro-interactions when marking items as 'completed'.