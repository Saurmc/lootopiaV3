import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Map, TrendingUp, Building2, Mail, Activity } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { invitationsService, invitationStatus } from '../services/invitations.service';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, sub, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-6 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-2 bg-gray-100 rounded w-32" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    staleTime: 30_000,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: invitationsService.list,
    staleTime: 30_000,
  });

  const pendingInvitations = invitations.filter((i) => invitationStatus(i) === 'pending').length;

  const statusLabels: Record<string, { label: string; cls: string }> = {
    pending: { label: t('invitations.statusPending'), cls: 'bg-amber-50 text-amber-600' },
    used:    { label: t('invitations.statusUsed'),    cls: 'bg-green-50 text-green-700' },
    expired: { label: t('invitations.statusExpired'), cls: 'bg-red-50 text-red-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('dashboard.title')}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* Métriques utilisateurs */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {t('dashboard.sectionUsers')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard
                label={t('dashboard.partners')}
                value={stats?.partner_count ?? 0}
                sub={t('dashboard.partnersSub')}
                icon={<Building2 className="h-5 w-5 text-orange-500" />}
                iconBg="bg-orange-50"
              />
              <KpiCard
                label={t('dashboard.players')}
                value={stats?.player_count ?? 0}
                sub={t('dashboard.playersSub')}
                icon={<Users className="h-5 w-5 text-[#4B49B8]" />}
                iconBg="bg-indigo-50"
              />
              <KpiCard
                label={t('dashboard.pendingInvitations')}
                value={pendingInvitations}
                sub={t('dashboard.pendingInvitationsSub')}
                icon={<Mail className="h-5 w-5 text-amber-500" />}
                iconBg="bg-amber-50"
              />
            </>
          )}
        </div>
      </div>

      {/* Métriques chasses */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {t('dashboard.sectionHunts')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard
                label={t('dashboard.totalHunts')}
                value={stats?.hunt_count ?? 0}
                sub={t('dashboard.totalHuntsSub')}
                icon={<Map className="h-5 w-5 text-purple-500" />}
                iconBg="bg-purple-50"
              />
              <KpiCard
                label={t('dashboard.activeHunts')}
                value={stats?.active_hunt_count ?? 0}
                sub={t('dashboard.activeHuntsSub')}
                icon={<Activity className="h-5 w-5 text-green-500" />}
                iconBg="bg-green-50"
              />
              <KpiCard
                label={t('dashboard.participations')}
                value={stats?.participant_count ?? 0}
                sub={t('dashboard.participationsSub')}
                icon={<Users className="h-5 w-5 text-blue-500" />}
                iconBg="bg-blue-50"
              />
              <KpiCard
                label={t('dashboard.completionRate')}
                value={`${stats?.completion_rate ?? 0} %`}
                sub={t('dashboard.completionRateSub_other', { count: stats?.completed_count ?? 0 })}
                icon={<TrendingUp className="h-5 w-5 text-[#4B49B8]" />}
                iconBg={(stats?.completion_rate ?? 0) >= 50 ? 'bg-indigo-50' : 'bg-red-50'}
              />
            </>
          )}
        </div>
      </div>

      {/* Invitations récentes */}
      {invitations.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            {t('dashboard.sectionRecent')}
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider">{t('dashboard.colEmail')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider hidden sm:table-cell">{t('dashboard.colOrg')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider">{t('dashboard.colStatus')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#4B49B8] uppercase tracking-wider hidden md:table-cell">{t('dashboard.colSentAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.slice(0, 5).map((inv) => {
                  const status = invitationStatus(inv);
                  const badge = statusLabels[status];
                  return (
                    <tr key={inv.id} className="hover:bg-[#F4F5FB] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{inv.email}</td>
                      <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{inv.partner_name ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
