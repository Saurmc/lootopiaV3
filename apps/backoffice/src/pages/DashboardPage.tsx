import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Map, Users, TrendingUp, Award } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { huntsService } from '@/services/hunts.service';
import { statsService } from '@/services/stats.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: hunts = [], isLoading: huntsLoading } = useQuery({
    queryKey: ['hunts'],
    queryFn: () => huntsService.getAll(),
  });

  // Fetch stats for all hunts in parallel
  const statsQueries = useQueries({
    queries: hunts.map((h) => ({
      queryKey: ['hunt-stats', h.id],
      queryFn: () => statsService.getHuntStats(h.id),
      staleTime: 60_000,
    })),
  });

  const allStats = statsQueries
    .map((q) => q.data)
    .filter((d): d is NonNullable<typeof d> => !!d);

  const activeCount = hunts.filter((h) => h.is_active).length;
  const totalParticipants = allStats.reduce((acc, s) => acc + s.participant_count, 0);
  const avgCompletion =
    allStats.length > 0
      ? Math.round(allStats.reduce((acc, s) => acc + s.completion_rate, 0) / allStats.length)
      : 0;
  const totalPoints = allStats.reduce((acc, s) => acc + s.average_points, 0);

  const chartData = hunts
    .map((h) => {
      const stats = statsQueries.find((q) => q.data?.hunt_id === h.id)?.data;
      return {
        name: h.title.length > 18 ? h.title.slice(0, 16) + '…' : h.title,
        participants: stats?.participant_count ?? 0,
        complétés: stats?.completed_count ?? 0,
      };
    })
    .filter((d) => d.participants > 0)
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 8);

  const isLoading = huntsLoading || statsQueries.some((q) => q.isLoading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Bienvenue{user?.email ? `, ${user.email}` : ''}.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Map className="h-5 w-5 text-primary" />}
          label="Chasses actives"
          value={isLoading ? '—' : String(activeCount)}
          sub={`${hunts.length} au total`}
          onClick={() => navigate('/hunts')}
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="Participants"
          value={isLoading ? '—' : String(totalParticipants)}
          sub="toutes chasses"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Taux de complétion"
          value={isLoading ? '—' : `${avgCompletion} %`}
          sub="moyenne globale"
        />
        <KpiCard
          icon={<Award className="h-5 w-5 text-amber-500" />}
          label="Points moyens"
          value={isLoading ? '—' : String(Math.round(totalPoints / Math.max(allStats.length, 1)))}
          sub="par chasse"
        />
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Participants par chasse</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="participants" name="Participants" fill="#4f52c8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="complétés" name="Complétés" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick hunt list */}
      {!isLoading && hunts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mes chasses récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {hunts.slice(0, 5).map((hunt) => {
                const stats = statsQueries.find((q) => q.data?.hunt_id === hunt.id)?.data;
                return (
                  <li
                    key={hunt.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/hunts/${hunt.id}/edit`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{hunt.title}</p>
                      <p className="text-xs text-gray-400">{hunt.location ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span>{stats?.participant_count ?? '—'} participants</span>
                      <span className={hunt.is_active ? 'text-green-600 font-medium' : 'text-orange-500'}>
                        {hunt.is_active ? 'Actif' : 'Brouillon'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isLoading && hunts.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          Aucune chasse.{' '}
          <button className="text-primary hover:underline" onClick={() => navigate('/hunts/new')}>
            Créez-en une
          </button>
          .
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div>
        <span className="text-3xl font-semibold text-gray-800">{value}</span>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
