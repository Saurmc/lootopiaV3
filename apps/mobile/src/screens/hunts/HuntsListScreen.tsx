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
import { useAuthStore } from '../../store/auth.store';
import { useHuntsList } from '../../hooks/useHunts';
import { haversineDistance, formatDistance } from '../../services/hunt.service';
import type { HuntListItem } from '../../services/hunt.service';
import HuntBottomSheet from '../map/HuntBottomSheet';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { key: '', label: 'Tous' },
  { key: 'easy', label: 'Facile' },
  { key: 'medium', label: 'Moyen' },
  { key: 'hard', label: 'Difficile' },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F97316',
  hard: '#EF4444',
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
  const diffColor = DIFFICULTY_COLORS[hunt.difficulty ?? ''] ?? '#6B7280';
  const diffLabel = DIFFICULTY_LABELS[hunt.difficulty ?? ''] ?? hunt.difficulty;

  const distance =
    userLat !== null && userLng !== null && hunt.lat !== null && hunt.lng !== null
      ? formatDistance(haversineDistance(userLat, userLng, hunt.lat, hunt.lng))
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{hunt.title}</Text>
        {hunt.difficulty && (
          <View style={[styles.diffBadge, { borderColor: diffColor }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
          </View>
        )}
      </View>

      {hunt.location ? (
        <Text style={styles.location} numberOfLines={1}>📍 {hunt.location}</Text>
      ) : null}

      {hunt.description ? (
        <Text style={styles.description} numberOfLines={2}>{hunt.description}</Text>
      ) : null}

      <View style={styles.cardMeta}>
        {distance ? <Text style={styles.metaChip}>🗺 {distance}</Text> : null}
        {hunt.duration ? <Text style={styles.metaChip}>⏱ {hunt.duration} min</Text> : null}
        <Text style={styles.metaChip}>⭐ {hunt.points} pts</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── HuntsListScreen ──────────────────────────────────────────────────────────

/**
 * HuntsListScreen — liste des chasses avec recherche textuelle et filtres.
 * Triée par distance (GPS) ou par titre (fallback).
 */
export default function HuntsListScreen() {
  const { consentGps } = useAuthStore();

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
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une chasse…"
          placeholderTextColor="#9CA3AF"
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
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
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
              <Text style={styles.emptyIcon}>🔍</Text>
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
        onJoin={() => {
          setSelectedHunt(null);
          // US53 : navigation vers HuntDetailScreen
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#fff',
  },
  count: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loader: {
    marginTop: 60,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  diffBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});
