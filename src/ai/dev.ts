import { config } from 'dotenv';
config();

import '@/ai/flows/generate-monthly-narrative.ts';
import '@/ai/flows/classify-movie-genres.ts';
import '@/ai/flows/get-movie-poster.ts';
