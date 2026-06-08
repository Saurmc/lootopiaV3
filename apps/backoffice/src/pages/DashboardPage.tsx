import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Map, Users, TrendingUp, Award, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { huntsService } from '@/services/hunts.service';
import { statsService } from '@/services/stats.service';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: hunts = [], isLoading: huntsLoading } = useQuery({
    queryKey: ['hunts'],
    queryFn: () => huntsService.getAll(),
  });

  const statsQueries = useQueries({
    queries: hunts.map((h) => ({
      queryKey: ['hunt-stats', h.id],
      queryFn: () => statsService.getHuntStats(h.id),
      staleTime: 60_000,
      retry: false,
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
        name: h.title.length > 16 ? h.title.slice(0, 14) + '…' : h.title,
        participants: stats?.participant_count ?? 0,
        complétés: stats?.completed_count ?? 0,
      };
    })
    .filter((d) => d.participants > 0)
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 8);

  // Top hunts pour le classement
  const topHunts = hunts
    .map((h) => {
      const stats = statsQueries.find((q) => q.data?.hunt_id === h.id)?.data;
      return { hunt: h, rate: stats?.completion_rate ?? 0, participants: stats?.participant_count ?? 0 };
    })
    .filter((d) => d.participants > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);

  const isLoading = huntsLoading || statsQueries.some((q) => q.isLoading);

  const kpiCards = [
    {
      label: t('dashboard.kpiActiveHunts'),
      value: isLoading ? '—' : String(activeCount),
      sub: `${hunts.length} ${t('dashboard.kpiTotal')}`,
      icon: <Map className="h-5 w-5 text-[#7C3AED]" />,
      iconBg: 'bg-purple-100',
      onClick: () => navigate('/hunts'),
    },
    {
      label: t('dashboard.kpiParticipants'),
      value: isLoading ? '—' : String(totalParticipants),
      sub: t('dashboard.kpiAllHunts'),
      icon: <Users className="h-5 w-5 text-[#EF4444]" />,
      iconBg: 'bg-red-100',
    },
    {
      label: t('dashboard.kpiCompletion'),
      value: isLoading ? '—' : `${avgCompletion} %`,
      sub: t('dashboard.kpiGlobalAvg'),
      icon: <TrendingUp className="h-5 w-5 text-[#22C55E]" />,
      iconBg: 'bg-green-100',
    },
    {
      label: t('dashboard.kpiAvgPoints'),
      value: isLoading ? '—' : String(Math.round(totalPoints / Math.max(allStats.length, 1))),
      sub: t('dashboard.kpiPerHunt'),
      icon: <Award className="h-5 w-5 text-[#F97316]" />,
      iconBg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('dashboard.title')}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('dashboard.subtitle')}{user?.email ? `, ${user.email}` : ''}.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 ${card.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={card.onClick}
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                {card.icon}
              </div>
              {card.onClick && (
                <ArrowUpRight className="h-4 w-4 text-gray-300" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wide">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top hunts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('dashboard.chartTitle')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B49B8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4B49B8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="participants"
                  name="Participants"
                  stroke="#4B49B8"
                  strokeWidth={2}
                  fill="url(#gradPart)"
                />
                <Area
                  type="monotone"
                  dataKey="complétés"
                  name="Complétés"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#gradComp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-300">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Top hunts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Chasses</h3>
          {topHunts.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-gray-300">
              Aucune donnée
            </div>
          ) : (
            <div className="space-y-3.5">
              {topHunts.map(({ hunt, rate }) => (
                <div key={hunt.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{hunt.title}</p>
                    <span className="text-xs font-semibold text-gray-500">{rate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        background: rate >= 70 ? '#22C55E' : rate >= 40 ? '#4B49B8' : '#F97316',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent hunts table */}
      {!isLoading && hunts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">{t('dashboard.recentHunts')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider">{t('hunts.colHunt')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider hidden sm:table-cell">{t('hunts.colDifficulty')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider">{t('hunts.colStatus')}</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider">{t('hunts.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hunts.slice(0, 5).map((hunt) => {
                const stats = statsQueries.find((q) => q.data?.hunt_id === hunt.id)?.data;
                return (
                  <tr
                    key={hunt.id}
                    className="hover:bg-[#F4F5FB] cursor-pointer transition-colors"
                    onClick={() => navigate(`/hunts/${hunt.id}/edit`)}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{hunt.title}</p>
                      <p className="text-xs text-gray-400">{hunt.location ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-gray-500 capitalize">{hunt.difficulty ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        hunt.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {hunt.is_active ? t('hunts.statusActive') : t('dashboard.draft')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-[#4B49B8] font-medium hover:underline">
                        Voir détails →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && hunts.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-sm text-gray-400">
            {t('hunts.noHunts')}{' '}
            <button className="text-[#4B49B8] hover:underline font-medium" onClick={() => navigate('/hunts/new')}>
              {t('hunts.noHuntsCreate')}
            </button>.
          </p>
        </div>
      )}
    </div>
  );
}
