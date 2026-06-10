'use server';

/**
 * @fileOverview Server-side MyAnimeList API integration.
 * Handles secure OAuth2 token exchange and status updates.
 */

const MAL_CLIENT_ID = process.env.NEXT_PUBLIC_MAL_CLIENT_ID || "";
const MAL_CLIENT_SECRET = process.env.MAL_CLIENT_SECRET || "";

export async function exchangeMalCode(code: string, codeVerifier: string) {
  if (!MAL_CLIENT_ID || !MAL_CLIENT_SECRET) {
    throw new Error('System configuration error: MAL credentials missing');
  }

  const tokenResponse = await fetch('https://myanimelist.net/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MAL_CLIENT_ID,
      client_secret: MAL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new Error(`Token Exchange Failed: ${errorData.error || tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  
  const listResponse = await fetch('https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status,genres,main_picture&limit=1000', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });

  if (!listResponse.ok) throw new Error('Failed to fetch Anime List');

  const data = await listResponse.json();
  
  const items = data.data.map((item: any) => ({
    id: `mal_${item.node.id}`,
    title: item.node.title,
    type: 'anime',
    status: item.list_status.status,
    rating: item.list_status.score || 0,
    imageUrl: item.node.main_picture?.large || item.node.main_picture?.medium || null,
    watchDate: new Date().toISOString().split('T')[0],
    platformSource: 'mal',
    platformId: item.node.id.toString(),
    posterStatus: 'pending',
    syncStatus: 'synced',
    genres: item.node.genres?.map((g: any) => g.name) || ['Anime']
  }));

  return { items, tokens: {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  }};
}

export async function refreshMalToken(refreshToken: string) {
  const response = await fetch('https://myanimelist.net/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MAL_CLIENT_ID,
      client_secret: MAL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new Error('Failed to refresh MAL token');
  
  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
}

export async function updateMalAnimeStatus(malId: string, accessToken: string, data: {
  status?: string;
  score?: number;
  num_watched_episodes?: number;
}) {
  const response = await fetch(`https://api.myanimelist.net/v2/anime/${malId}/my_list_status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data as any),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'MAL API Update Failed');
  }

  return await response.json();
}
