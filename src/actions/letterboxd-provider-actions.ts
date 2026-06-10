
'use server';

/**
 * @fileOverview Removed: Scraping providers disabled for production stability.
 */
export async function fetchLetterboxdDiaryPage() {
  return { entries: [], hasNext: false, totalInPage: 0 };
}
