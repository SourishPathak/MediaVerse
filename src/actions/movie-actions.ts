
'use server';

/**
 * @fileOverview Movie actions using a deterministic styling system.
 * Returns empty genres to ensure the AI engine handles all classification.
 */

export async function fetchMoviePosterPlaceholder(title: string, year?: string) {
  const colors = [
    'rgba(99, 102, 241, 0.2)', 
    'rgba(168, 85, 247, 0.2)', 
    'rgba(236, 72, 153, 0.2)', 
    'rgba(244, 63, 100, 0.2)', 
    'rgba(239, 68, 68, 0.2)', 
    'rgba(245, 158, 11, 0.2)', 
    'rgba(16, 185, 129, 0.2)', 
    'rgba(6, 182, 212, 0.2)', 
    'rgba(59, 130, 246, 0.2)'
  ];
  
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  return {
    posterUrl: null,
    largePosterUrl: null,
    synopsis: null,
    genres: [], // Strictly empty to wait for AI classification
    themeColor: color
  };
}
