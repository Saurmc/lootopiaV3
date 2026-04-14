import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService, UpdateProfilePayload } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';

export function useBadges() {
  const { isGuest } = useAuthStore();
  return useQuery({
    queryKey: ['me', 'badges'],
    queryFn: profileService.fetchBadges,
    staleTime: 60_000,
    enabled: !isGuest,
  });
}

export function useProfile() {
  const { isGuest } = useAuthStore();
  return useQuery({
    queryKey: ['me', 'profile'],
    queryFn: profileService.fetchProfile,
    staleTime: 60_000,
    enabled: !isGuest,
  });
}

export function usePlayerStats() {
  const { isGuest } = useAuthStore();
  return useQuery({
    queryKey: ['me', 'stats'],
    queryFn: profileService.fetchStats,
    staleTime: 30_000,
    enabled: !isGuest,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
    },
  });
}
