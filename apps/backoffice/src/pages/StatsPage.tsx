import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { huntsService } from '@/services/hunts.service';
import { statsService, type ParticipantDto } from '@/services/stats.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DIFF_LABEL: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function StatsPage() {
  const [expandedHuntId, setExpandedHuntId] = useState<string | null>(null);

  const { data: hunts = [], isLoading: huntsLoading } = useQuery({
    queryKey: ['hunts'],
    queryFn: () => huntsService.getAll(),
  });

  const statsQueries = useQueries({
    queries: hunts.map((h) => ({
      queryKey: ['hunt-stats', h.id],
      queryFn: () => statsService.getHuntStats(h.id),
      staleTime: 60_000,
    })),
  });

  const { data: participants = [], isFetching: participantsFetching } = useQuery({
    queryKey: ['hunt-participants', expandedHuntId],
    queryFn: () => statsService.getHuntParticipants(expandedHuntId!),
    enabled: !!expandedHuntId,
    staleTime: 30_000,
  });

  const isLoading = huntsLoading || statsQueries.some((q) => q.isLoading);

  function toggleExpand(huntId: string) {
    setExpandedHuntId((prev) => (prev === huntId ? null : huntId));
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performances de toutes vos chasses.</p>
      </div>

      {hunts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">Aucune chasse disponible.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Résumé par chasse</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 w-8" />
                  <th className="text-left px-6 py-3">Chasse</th>
                  <th className="text-right px-4 py-3">Participants</th>
                  <th className="text-right px-4 py-3">Complétés</th>
                  <th className="text-right px-4 py-3">Complétion</th>
                  <th className="text-right px-6 py-3">Pts moyens</th>
                </tr>
              </thead>
              <tbody>
                {hunts.map((hunt, i) => {
                  const stats = statsQueries[i]?.data;
                  const isExpanded = expandedHuntId === hunt.id;

                  return (
                    <>
                      <tr
                        key={hunt.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleExpand(hunt.id)}
                      >
                        <td className="px-6 py-3 text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{hunt.title}</p>
                          <p className="text-xs text-gray-400">
                            {hunt.location ?? '—'}
                            {hunt.difficulty ? ` · ${DIFF_LABEL[hunt.difficulty] ?? hunt.difficulty}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {stats?.participant_count ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {stats?.completed_count ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {stats ? (
                            <CompletionBadge rate={stats.completion_rate} />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-700">
                          {stats ? Math.round(stats.average_points) : '—'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${hunt.id}-detail`} className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <ParticipantTable
                              participants={participants}
                              loading={participantsFetching}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CompletionBadge({ rate }: { rate: number }) {
  const color =
    rate >= 75
      ? 'bg-green-100 text-green-700'
      : rate >= 40
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {rate} %
    </span>
  );
}

function ParticipantTable({
  participants,
  loading,
}: {
  participants: ParticipantDto[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-xs text-gray-400 py-2">Chargement des participants…</p>;
  }

  if (participants.length === 0) {
    return (
      <p className="text-xs text-gray-400 flex items-center gap-1.5 py-2">
        <Users className="h-3.5 w-3.5" />
        Aucun participant pour cette chasse.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-white text-gray-500 uppercase tracking-wide">
            <th className="text-left px-4 py-2">Email</th>
            <th className="text-right px-4 py-2">Étape</th>
            <th className="text-right px-4 py-2">Étapes faites</th>
            <th className="text-right px-4 py-2">Points</th>
            <th className="text-right px-4 py-2">Démarré le</th>
            <th className="text-right px-4 py-2">Terminé le</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.user_id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">{p.email}</td>
              <td className="px-4 py-2 text-right text-gray-700">{p.current_step}</td>
              <td className="px-4 py-2 text-right text-gray-700">{p.completed_steps.length}</td>
              <td className="px-4 py-2 text-right font-medium text-gray-900">{p.total_points}</td>
              <td className="px-4 py-2 text-right text-gray-400">
                {new Date(p.started_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-4 py-2 text-right text-gray-400">
                {p.completed_at
                  ? new Date(p.completed_at).toLocaleDateString('fr-FR')
                  : <span className="text-orange-500">En cours</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
