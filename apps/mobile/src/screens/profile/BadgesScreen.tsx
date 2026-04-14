import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBadges } from '../../hooks/useProfile';
import { useHuntHistory } from '../../hooks/useHunts';
import { useHuntsList } from '../../hooks/useHunts';

// ─── Catalogue des badges (client-side) ──────────────────────────────────────

interface BadgeDef {
  type: string;
  icon: string;
  name: string;
  description: string;
  condition: string;
}

const BADGE_CATALOG: BadgeDef[] = [
  {
    type: 'first_hunt',
    icon: '🏁',
    name: 'Première chasse',
    description: 'Terminer votre toute première chasse au trésor.',
    condition: 'Compléter 1 chasse',
  },
  {
    type: 'hunt_completed',
    icon: '🏆',
    name: 'Chasseur',
    description: 'Valider au moins une chasse au trésor jusqu\'au bout.',
    condition: 'Compléter 1 chasse',
  },
  {
    type: 'explorer',
    icon: '🗺',
    name: 'Explorateur',
    description: 'Participer à au moins 5 chasses différentes.',
    condition: 'Rejoindre 5 chasses',
  },
  {
    type: 'collector',
    icon: '💎',
    name: 'Collectionneur',
    description: 'Obtenir 3 badges distincts.',
    condition: 'Débloquer 3 badges',
  },
  {
    type: 'speedrunner',
    icon: '⚡',
    name: 'Speedrunner',
    description: 'Terminer une chasse en moins de 15 minutes.',
    condition: 'Finir une chasse < 15 min',
  },
  {
    type: 'legend',
    icon: '🌟',
    name: 'Légende',
    description: 'Atteindre le niveau maximum (Légende).',
    condition: 'Accumuler 1 400 pts',
  },
];

// ─── BadgeCard ────────────────────────────────────────────────────────────────

function BadgeCard({
  def,
  earned,
  earnedAt,
  onPress,
}: {
  def: BadgeDef;
  earned: boolean;
  earnedAt?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.badgeCard, !earned && styles.badgeCardLocked]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
        {def.icon}
      </Text>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={1}>
        {def.name}
      </Text>
      {earned && earnedAt ? (
        <Text style={styles.badgeDate}>
          {new Date(earnedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>
      ) : (
        <Text style={styles.badgeCondition} numberOfLines={2}>
          {def.condition}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── BadgeModal ───────────────────────────────────────────────────────────────

function BadgeModal({
  def,
  earned,
  earnedAt,
  visible,
  onClose,
}: {
  def: BadgeDef | null;
  earned: boolean;
  earnedAt?: string;
  visible: boolean;
  onClose: () => void;
}) {
  if (!def) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalIcon, !earned && styles.badgeIconLocked]}>{def.icon}</Text>
          <Text style={styles.modalName}>{def.name}</Text>
          <Text style={styles.modalDescription}>{def.description}</Text>

          {earned && earnedAt ? (
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedBadgeText}>
                Obtenu le{' '}
                {new Date(earnedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>Condition : {def.condition}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── BadgesScreen ─────────────────────────────────────────────────────────────

export default function BadgesScreen() {
  const { data: badges = [], isLoading: badgesLoading } = useBadges();
  const { data: history = [], isLoading: historyLoading } = useHuntHistory();
  const { data: allHunts = [], isLoading: huntsLoading } = useHuntsList('');

  const [modalDef, setModalDef] = useState<BadgeDef | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const earnedMap = new Map(badges.map((b) => [b.badge_type, b.earned_at]));

  const completedHistory = history.filter((h) => h.completed_at !== null);

  const huntTitleMap = new Map(allHunts.map((h) => [h.id, h.title]));

  const isLoading = badgesLoading || historyLoading || huntsLoading;

  function openModal(def: BadgeDef) {
    setModalDef(def);
    setModalVisible(true);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Badges ── */}
        <Text style={styles.sectionTitle}>
          Badges{' '}
          <Text style={styles.sectionCount}>
            {earnedMap.size}/{BADGE_CATALOG.length}
          </Text>
        </Text>

        <View style={styles.badgesGrid}>
          {BADGE_CATALOG.map((def) => {
            const earned = earnedMap.has(def.type);
            return (
              <BadgeCard
                key={def.type}
                def={def}
                earned={earned}
                earnedAt={earnedMap.get(def.type)}
                onPress={() => openModal(def)}
              />
            );
          })}
        </View>

        {/* ── Historique des chasses ── */}
        <Text style={[styles.sectionTitle, styles.sectionTitleTop]}>
          Chasses terminées{' '}
          <Text style={styles.sectionCount}>{completedHistory.length}</Text>
        </Text>

        {completedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺</Text>
            <Text style={styles.emptyText}>Aucune chasse terminée pour l'instant.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {completedHistory.map((item) => (
              <View key={item.hunt_id} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {huntTitleMap.get(item.hunt_id) ?? 'Chasse inconnue'}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.completed_at!).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyPoints}>+{item.total_points}</Text>
                  <Text style={styles.historyPtsLabel}>pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BadgeModal
        def={modalDef}
        earned={modalDef ? earnedMap.has(modalDef.type) : false}
        earnedAt={modalDef ? earnedMap.get(modalDef.type) : undefined}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 12 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  sectionTitleTop: { marginTop: 8 },
  sectionCount: { fontSize: 15, fontWeight: '500', color: '#6B7280' },

  // ── Grid de badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  badgeCardLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  badgeIcon: { fontSize: 28 },
  badgeIconLocked: { opacity: 0.3 },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  badgeNameLocked: { color: '#9CA3AF' },
  badgeDate: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  badgeCondition: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Historique
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  historyList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyLeft: { flex: 1, gap: 2 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#9CA3AF' },
  historyRight: { alignItems: 'flex-end' },
  historyPoints: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  historyPtsLabel: { fontSize: 10, color: '#6B7280' },

  // ── Modal badge
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  modalIcon: { fontSize: 52 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  earnedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  earnedBadgeText: { fontSize: 13, fontWeight: '600', color: '#065F46' },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lockedBadgeText: { fontSize: 13, color: '#6B7280' },
  modalCloseBtn: {
    marginTop: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 28,
  },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
