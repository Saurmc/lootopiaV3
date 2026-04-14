import { useQuery } from '@tanstack/react-query';
import { huntService } from '../services/hunt.service';
import { useAuthStore } from '../store/auth.store';

/**
 * Récupère toutes les chasses actives ayant des coordonnées GPS.
 * Stale time de 60 s pour éviter les requêtes répétées lors de la navigation.
 */
export function useHuntsOnMap() {
  return useQuery({
    queryKey: ['hunts', 'map'],
    queryFn: huntService.fetchHunts,
    staleTime: 60_000,
  });
}

/**
 * Récupère les chasses pour la liste (toutes, ou filtrées par recherche textuelle).
 * Stale time de 30 s.
 */
export function useHuntsList(q: string) {
  return useQuery({
    queryKey: ['hunts', 'list', q],
    queryFn: () => huntService.fetchHuntsForList(q || undefined),
    staleTime: 30_000,
  });
}

/** Récupère le détail d'une chasse (titre, étapes, difficulté…). */
export function useHuntDetail(huntId: string) {
  return useQuery({
    queryKey: ['hunt', huntId],
    queryFn: () => huntService.fetchHuntDetail(huntId),
    staleTime: 60_000,
  });
}

/**
 * Récupère la progression du joueur sur une chasse.
 * Retourne null si le joueur n'a pas encore rejoint.
 */
export function useHuntProgress(huntId: string) {
  return useQuery({
    queryKey: ['hunt', huntId, 'progress'],
    queryFn: () => huntService.fetchHuntProgress(huntId),
    staleTime: 10_000,
    retry: false,
  });
}

/**
 * Récupère l'ensemble de l'historique du joueur (pour marquer les chasses terminées).
 * Désactivé pour les invités (pas de progression persistante).
 */
export function useHuntHistory() {
  const { isGuest } = useAuthStore();

  return useQuery({
    queryKey: ['hunts', 'history'],
    queryFn: huntService.fetchHuntHistory,
    staleTime: 60_000,
    enabled: !isGuest,
  });
}
