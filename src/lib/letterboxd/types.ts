
/**
 * @fileOverview Modular Provider Interfaces for future expansion.
 * Scraping implementations are disabled to ensure static reliability.
 */

export interface MediaProvider {
  id: string;
  name: string;
  enabled: boolean;
  importMethod: 'file' | 'api';
  fileFormat?: '.csv' | '.xml';
}

export const PROVIDERS: MediaProvider[] = [
  { id: 'letterboxd', name: 'Letterboxd', enabled: true, importMethod: 'file', fileFormat: '.csv' },
  { id: 'mal', name: 'MyAnimeList', enabled: true, importMethod: 'file', fileFormat: '.xml' }
];

export interface MediaImportResult {
  successCount: number;
  errorCount: number;
  provider: string;
}
