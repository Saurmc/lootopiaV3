import { AxiosError } from 'axios';

/**
 * Extrait le status HTTP et le message lisible d'une erreur Axios.
 * Utilisé dans les screens pour afficher les erreurs API sous les champs concernés.
 */
export function extractApiError(err: unknown): { status: number; message: string } {
  if (err instanceof AxiosError && err.response) {
    const status = err.response.status;
    const data = err.response.data as { message?: string | string[] };
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? 'Une erreur est survenue.');
    return { status, message };
  }
  return { status: 0, message: 'Impossible de joindre le serveur.' };
}
