import { api } from './api';
import { offlineService } from './offline.service';

/** Chasse avec coordonnées GPS garanties (pour les marqueurs carte). */
export interface HuntMapItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: string | null;
  duration: number | null;
  points: number;
  lat: number;
  lng: number;
}

/** Chasse pour la liste — coordonnées optionnelles. */
export interface HuntListItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: string | null;
  duration: number | null;
  points: number;
  lat: number | null;
  lng: number | null;
}

export interface HuntHistoryItem {
  hunt_id: string;
  total_points: number;
  started_at: string;
  completed_at: string | null;
}

export type StepStatus = 'completed' | 'current' | 'locked';

export interface StepDetail {
  id: string;
  order: number;
  title: string;
  description: string | null;
  status: StepStatus;
  validation_type: string;
  validation_radius: number;
  coordinates: { lat: number; lng: number } | null;
  thumbnail: string | null;
  ar_content: unknown | null;
}

export interface HuntProgress {
  progress_id: string;
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: string;
  completed_at: string | null;
  steps: StepDetail[];
}

export interface HuntDetail {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: string | null;
  duration: number | null;
  points: number;
  step_count: number;
  steps: Array<{
    id: string;
    order: number;
    title: string;
    description: string | null;
    thumbnail: string | null;
    ar_content: unknown | null;
  }>;
}

/**
 * Parse les coordonnées PostGIS retournées par TypeORM.
 * TypeORM peut renvoyer un objet GeoJSON { type, coordinates: [lng, lat] }
 * ou une chaîne JSON de ce même objet.
 */
function parseCoordinates(raw: unknown): { lat: number; lng: number } | null {
  if (!raw) return null;

  let geo: { coordinates?: [number, number] } | null = null;

  if (typeof raw === 'object') {
    geo = raw as { coordinates?: [number, number] };
  } else if (typeof raw === 'string') {
    try {
      geo = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!geo || !Array.isArray(geo.coordinates) || geo.coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = geo.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  return { lat, lng };
}

/** Distance Haversine entre deux points GPS (en mètres). */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Formate une distance en mètres en chaîne lisible. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export const huntService = {
  /**
   * GET /hunts — retourne toutes les chasses actives avec coordonnées parsées.
   * Les chasses sans coordonnées GPS sont exclues de la carte.
   */
  fetchHunts: async (): Promise<HuntMapItem[]> => {
    const res = await api.get<
      Array<{
        id: string;
        title: string;
        description: string | null;
        location: string | null;
        difficulty: string | null;
        duration: number | null;
        points: number;
        coordinates: unknown;
      }>
    >('/hunts');

    return res.data
      .map((h) => {
        const coords = parseCoordinates(h.coordinates);
        if (!coords) return null;
        return {
          id: h.id,
          title: h.title,
          description: h.description,
          location: h.location,
          difficulty: h.difficulty,
          duration: h.duration,
          points: h.points,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((h): h is HuntMapItem => h !== null);
  },

  /**
   * GET /hunts (+ ?q=) — retourne toutes les chasses actives pour la liste.
   * Coordonnées optionnelles (null si non renseignées).
   */
  fetchHuntsForList: async (q?: string): Promise<HuntListItem[]> => {
    const res = await api.get<
      Array<{
        id: string;
        title: string;
        description: string | null;
        location: string | null;
        difficulty: string | null;
        duration: number | null;
        points: number;
        coordinates: unknown;
      }>
    >('/hunts', { params: q ? { q } : undefined });

    return res.data.map((h) => {
      const coords = parseCoordinates(h.coordinates);
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        location: h.location,
        difficulty: h.difficulty,
        duration: h.duration,
        points: h.points,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };
    });
  },

  /** GET /hunts/:id — détail d'une chasse avec ses étapes (sans statut). */
  fetchHuntDetail: async (huntId: string): Promise<HuntDetail> => {
    const res = await api.get<HuntDetail>(`/hunts/${huntId}`);
    return res.data;
  },

  /**
   * GET /hunts/:id/progress — progression du joueur sur une chasse.
   * Falls back to AsyncStorage cache when offline.
   */
  fetchHuntProgress: async (huntId: string): Promise<HuntProgress | null> => {
    try {
      const res = await api.get<HuntProgress>(`/hunts/${huntId}/progress`);
      await offlineService.cacheHunt(huntId, res.data);
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      if (offlineService.isNetworkError(err)) {
        return offlineService.getCachedHunt<HuntProgress>(huntId);
      }
      throw err;
    }
  },

  /** POST /hunts/:id/join — rejoint la chasse et crée l'entrée de progression. */
  joinHunt: async (huntId: string): Promise<HuntProgress> => {
    const res = await api.post<HuntProgress>(`/hunts/${huntId}/join`);
    await offlineService.cacheHunt(huntId, res.data);
    return res.data;
  },

  /**
   * POST /hunts/:id/steps/:stepId/validate — valide l'étape courante.
   * When offline, queues the request for automatic retry on reconnection.
   */
  validateStep: async (
    huntId: string,
    stepId: string,
    payload: { lat: number; lng: number } | { qr_code: string } | { answer: string } | { file_url: string } | { marker_triggered: boolean } | Record<string, unknown>,
  ): Promise<HuntProgress> => {
    try {
      const res = await api.post<HuntProgress>(`/hunts/${huntId}/steps/${stepId}/validate`, payload);
      await offlineService.cacheHunt(huntId, res.data);
      return res.data;
    } catch (err: unknown) {
      if (offlineService.isNetworkError(err)) {
        await offlineService.enqueueValidation(huntId, stepId, payload as Record<string, unknown>);
        throw Object.assign(new Error('offline'), { isOfflineQueued: true });
      }
      throw err;
    }
  },

  /**
   * GET /me/hunts — retourne l'historique du joueur pour identifier les chasses terminées.
   */
  fetchHuntHistory: async (): Promise<HuntHistoryItem[]> => {
    const res = await api.get<HuntHistoryItem[]>('/me/hunts');
    return res.data;
  },
};
