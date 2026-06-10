
'use server';
/**
 * @fileOverview A Genkit flow for generating a cinematic, Spotify-Wrapped style media recap.
 * Returns a journey-based narrative with personas, achievements, and surprise insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMonthlyNarrativeInputSchema = z.object({
  month: z.string().describe('The month for which the narrative is being generated (e.g., "January 2024").'),
  totalAnimeWatched: z.number().describe('The total number of anime titles watched during the month.'),
  totalMoviesWatched: z.number().describe('The total number of movies watched during the month.'),
  totalHoursWatched: z.number().describe('The total number of hours spent watching media during the month.'),
  topGenres: z.array(z.string()).describe('An array of the top genres consumed during the month.'),
  mostWatchedAnime: z.array(z.string()).describe('An array of the most watched anime titles during the month.'),
  mostWatchedMovies: z.array(z.string()).describe('An array of the most watched movie titles during the month.'),
});
export type GenerateMonthlyNarrativeInput = z.infer<typeof GenerateMonthlyNarrativeInputSchema>;

const GenerateMonthlyNarrativeOutputSchema = z.object({
  viewerPersona: z.string().describe('A unique cinematic title for the user (e.g. "The Cyberpunk Dreamer").'),
  narration: z.string().describe('An emotional, celebratory summary of their month as a dimension traveler.'),
  achievements: z.array(z.object({
    title: z.string().describe('A personalized award title (e.g. "The Mecha Commander").'),
    description: z.string().describe('A witty, rewarding description of why they earned this.'),
    icon: z.string().describe('A lucide icon name representation (trophy, zap, crown, etc).')
  })).describe('Exactly 3 personalized legendary achievements.'),
  surpriseInsight: z.string().describe('A dramatic, playful identification of a weird pattern in their data.'),
  suggestedActivityDistribution: z.array(z.object({
    label: z.string(),
    anime: z.number(),
    movies: z.number()
  })).describe('An array of 4 objects representing weeks 1-4 for the momentum graph.')
});
export type GenerateMonthlyNarrativeOutput = z.infer<typeof GenerateMonthlyNarrativeOutputSchema>;

export async function generateMonthlyNarrative(input: GenerateMonthlyNarrativeInput): Promise<GenerateMonthlyNarrativeOutput> {
  return generateMonthlyNarrativeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMonthlyNarrativePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateMonthlyNarrativeInputSchema},
  output: {schema: GenerateMonthlyNarrativeOutputSchema},
  system: `You are a cinematic media critic with "Main Character" energy. 
Your goal is to make the user feel recognized, understood, and rewarded for their entertainment journey. 
AVOID dry analytics. USE evocative, pithy, and celebratory language. 
Think Spotify Wrapped for anime and cinema.`,
  prompt: `Analyze this archival data for {{{month}}}:
- Stats: {{{totalAnimeWatched}}} Anime, {{{totalMoviesWatched}}} Films, {{{totalHoursWatched}}} Hours.
- Top Genres: {{#each topGenres}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Recent Obsessions: {{#each mostWatchedAnime}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}} / {{#each mostWatchedMovies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Transform this into a journey:
1. Create a **Viewer Persona** that encapsulates their vibe.
2. Provide a **Narration** that treats their watch history as a resume for a dimension traveler.
3. Define **3 Legendary Achievements** with witty, personalized titles (e.g. "The Slice-of-Life Therapist").
4. Identify one **Surprise Insight**—a dramatic or playful observation about their habits.
5. Provide the week-by-week momentum distribution.`,
});

const generateMonthlyNarrativeFlow = ai.defineFlow(
  {
    name: 'generateMonthlyNarrativeFlow',
    inputSchema: GenerateMonthlyNarrativeInputSchema,
    outputSchema: GenerateMonthlyNarrativeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('The archival story failed to manifest.');
    return output;
  }
);
