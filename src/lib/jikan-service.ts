
'use client';

/**
 * @fileOverview Jikan API Service for Anime Enrichment.
 * Handles rate limiting, queueing, and metadata retrieval.
 * Includes retry logic for transient 500-range errors.
 */

export interface JikanEnrichmentData {
  posterUrl: string;
  largePosterUrl: string;
  synopsis: string;
  genres: string[];
  status: string;
}

class JikanQueue {
  private queue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private minInterval: number = 1500; // 1.5s between requests (40 req/min)

  async process<T>(fn: () => Promise<T>, retryCount = 0): Promise<T> {
    return this.queue = this.queue.then(async () => {
      const now = Date.now();
      const waitTime = Math.max(0, this.minInterval - (now - this.lastRequestTime));
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      try {
        const result = await fn();
        this.lastRequestTime = Date.now();
        return result;
      } catch (error: any) {
        const status = error.status || (error.message?.match(/(\d{3})/) ? parseInt(error.message.match(/(\d{3})/)[1]) : 0);
        
        // Handle Rate Limiting (429)
        if (status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.process(fn, retryCount);
        }

        // Handle Transient Server Errors (500+) with exponential backoff
        if (status >= 500 && retryCount < 3) {
          const backoff = Math.pow(2, retryCount) * 2000;
          await new Promise(resolve => setTimeout(resolve, backoff));
          return this.process(fn, retryCount + 1);
        }

        throw error;
      }
    });
  }
}

const jikanQueue = new JikanQueue();

export async function fetchAnimeEnrichment(malId: string): Promise<JikanEnrichmentData | null> {
  return jikanQueue.process(async () => {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    
    if (!response.ok) {
      if (response.status === 404) throw new Error("Anime not found in Jikan database.");
      throw new Error(`Jikan API Error: ${response.status}`);
    }

    const json = await response.json();
    const data = json.data;

    // Safety check: Return null instead of throwing if payload is missing
    // This allows the background hook to handle failures gracefully.
    if (!data) {
      return null;
    }

    return {
      posterUrl: data.images?.jpg?.image_url || "",
      largePosterUrl: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || "",
      synopsis: data.synopsis || "No overview available.",
      genres: data.genres?.map((g: any) => g.name) || [],
      status: data.status || "Unknown"
    };
  });
}
