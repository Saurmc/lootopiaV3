import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/auth.store';
import { useHuntsList } from '../../hooks/useHunts';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { haversineDistance, formatDistance } from '../../services/hunt.service';
import type { HuntListItem } from '../../services/hunt.service';
import HuntBottomSheet from '../map/HuntBottomSheet';
import theme from '../../constants/theme';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { key: '', label: 'Tous' },
  { key: 'easy', label: 'Facile' },
  { key: 'medium', label: 'Moyen' },
  { key: 'hard', label: 'Difficile' },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: theme.colors.difficultyEasy,
  medium: theme.colors.difficultyMedium,
  hard: theme.colors.difficultyHard,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── HuntCard ─────────────────────────────────────────────────────────────────

interface HuntCardProps {
  hunt: HuntListItem;
  userLat: number | null;
  userLng: number | null;
  onPress: () => void;
}

function HuntCard({ hunt, userLat, userLng, onPress }: HuntCardProps) {
  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? theme.colors.textSecondary;
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty;

  const distance =
    userLat !== null && userLng !== null && hunt.lat !== null && hunt.lng !== null
      ? formatDistance(haversineDistance(userLat, userLng, hunt.lat, hunt.lng))
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Icône carrée violette gauche */}
      <View style={styles.cardIconBox}>
        <Ionicons name="compass" size={28} color={theme.colors.textInverse} />
      </View>

      {/* Contenu central */}
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{hunt.title}</Text>
          {hunt.difficulty && (
            <View style={[styles.diffBadge, { borderColor: diffColor }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
            </View>
          )}
        </View>

        {hunt.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>{hunt.location}</Text>
          </View>
        ) : null}

        <View style={styles.cardMeta}>
          {distance ? (
            <View style={styles.metaItem}>
              <Ionicons name="map-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{distance}</Text>
            </View>
          ) : null}
          {hunt.duration ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{hunt.duration} min</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="star" size={11} color={theme.colors.points} />
            <Text style={styles.metaText}>{hunt.points} pts</Text>
          </View>
        </View>
      </View>

      {/* Bouton play corail */}
      <TouchableOpacity style={styles.playBtn} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="play" size={18} color={theme.colors.textInverse} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── HuntsListScreen ──────────────────────────────────────────────────────────

/**
 * HuntsListScreen — liste des chasses avec recherche textuelle et filtres.
 * Triée par distance (GPS) ou par titre (fallback).
 * Accessible depuis le hamburger de MapScreen (stack modal).
 */
type HuntsNavProp = NativeStackNavigationProp<AppStackParamList>;

export default function HuntsListScreen() {
  const { consentGps } = useAuthStore();
  const navigation = useNavigation<HuntsNavProp>();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHunt, setSelectedHunt] = useState<HuntListItem | null>(null);

  const debouncedQ = useDebounce(search, 400);
  const { data: hunts = [], isLoading } = useHuntsList(debouncedQ);

  // Récupère la dernière position connue (rapide, pas de nouvelle demande de permission)
  useEffect(() => {
    if (!consentGps) return;
    Location.getLastKnownPositionAsync().then((loc) => {
      if (loc) setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    });
  }, [consentGps]);

  const filtered = useMemo(() => {
    let result = filter ? hunts.filter((h) => h.difficulty === filter) : hunts;

    if (userPos) {
      result = [...result].sort((a, b) => {
        const da =
          a.lat !== null && a.lng !== null
            ? haversineDistance(userPos.lat, userPos.lng, a.lat, a.lng)
            : Infinity;
        const db =
          b.lat !== null && b.lng !== null
            ? haversineDistance(userPos.lat, userPos.lng, b.lat, b.lng)
            : Infinity;
        return da - db;
      });
    } else {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [hunts, filter, userPos]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une chasse…"
          placeholderTextColor={theme.colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres difficulté */}
      <View style={styles.filterRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.chip, filter === d.key && styles.chipActive]}
            onPress={() => setFilter(d.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, filter === d.key && styles.chipTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Compteur résultats */}
      {!isLoading && (
        <Text style={styles.count}>
          {filtered.length} chasse{filtered.length !== 1 ? 's' : ''}
          {filter ? ` · ${DIFFICULTY_LABELS[filter]}` : ''}
          {userPos ? ' · triées par distance' : ''}
        </Text>
      )}

      {/* Liste */}
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HuntCard
              hunt={item}
              userLat={userPos?.lat ?? null}
              userLng={userPos?.lng ?? null}
              onPress={() => setSelectedHunt(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textDisabled} />
              <Text style={styles.emptyText}>Aucune chasse trouvée</Text>
              {search ? (
                <Text style={styles.emptyHint}>Essayez un autre mot-clé</Text>
              ) : null}
            </View>
          }
        />
      )}

      {/* Bottom sheet détail */}
      <HuntBottomSheet
        hunt={selectedHunt}
        userLat={userPos?.lat ?? null}
        userLng={userPos?.lng ?? null}
        onClose={() => setSelectedHunt(null)}
        onJoin={(hunt) => {
          setSelectedHunt(null);
          navigation.navigate('HuntDetail', { huntId: hunt.id });
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.caption,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.textInverse,
  },
  count: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  loader: {
    marginTop: 60,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.huntIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    ...theme.typography.h3,
    fontSize: 15,
  },
  diffBadge: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  diffText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  emptyHint: {
    ...theme.typography.bodySmall,
    color: theme.colors.textDisabled,
  },
});
