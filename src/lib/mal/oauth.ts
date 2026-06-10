'use client';

/**
 * @fileOverview MAL OAuth2 PKCE Helper.
 * Manages secure handshake state for direct API synchronization.
 */

export function generateCodeVerifier() {
  const array = new Uint32Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

export function generateMalAuthUrl(clientId: string, codeVerifier: string) {
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('mal_state', state);
  localStorage.setItem('mal_code_verifier', codeVerifier);

  const url = new URL('https://myanimelist.net/v1/oauth2/authorize');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('state', state);
  url.searchParams.append('code_challenge', codeVerifier);
  url.searchParams.append('code_challenge_method', 'plain');
  
  return { url: url.toString(), state };
}
