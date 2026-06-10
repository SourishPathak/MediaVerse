
'use server';
/**
 * @fileOverview A Genkit flow for classifying movie genres.
 * - classifyMovieGenres - A function that handles the movie genre classification process.
 * - ClassifyMovieGenresInput - The input type for the function.
 * - ClassifyMovieGenresOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyMovieGenresInputSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  year: z.string().optional().describe('The release year of the movie.'),
});
export type ClassifyMovieGenresInput = z.infer<typeof ClassifyMovieGenresInputSchema>;

const ClassifyMovieGenresOutputSchema = z.object({
  genres: z.array(z.string()).describe('A list of standard genres.'),
});
export type ClassifyMovieGenresOutput = z.infer<typeof ClassifyMovieGenresOutputSchema>;

export async function classifyMovieGenres(input: ClassifyMovieGenresInput): Promise<ClassifyMovieGenresOutput> {
  return classifyMovieGenresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyMovieGenresPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ClassifyMovieGenresInputSchema},
  output: {schema: ClassifyMovieGenresOutputSchema},
  prompt: `You are an expert film historian. 

Given the movie title "{{{title}}}"{{#if year}} released in {{{year}}}{{/if}}, identify 2-4 primary genres that best describe this film.

STRICT RULES:
1. DO NOT use "Cinema", "Film", or "Movie" as genres.
2. Use standard industry genres (e.g., "Sci-Fi", "Drama", "Action", "Thriller", "Horror", "Comedy", "Romance", "Noir", "Documentary").
3. Be specific and accurate based on the film's reputation.`,
});

const classifyMovieGenresFlow = ai.defineFlow(
  {
    name: 'classifyMovieGenresFlow',
    inputSchema: ClassifyMovieGenresInputSchema,
    outputSchema: ClassifyMovieGenresOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.genres || output.genres.length === 0) {
      return { genres: ['Drama'] }; // Safe fallback
    }
    return output;
  }
);
