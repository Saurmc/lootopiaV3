import { API_BASE_URL } from '../constants/api.constants';

/**
 * Résout une URL de fichier retournée par l'API.
 * - URL absolue (http/https) → retournée telle quelle
 * - Chemin relatif (/files/serve?key=…) → API_BASE_URL + chemin
 * - Chaîne vide ou null → retournée telle quelle
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return url as string;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
