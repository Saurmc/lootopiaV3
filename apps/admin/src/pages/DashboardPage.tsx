import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import { invitationsService, invitationStatus } from '../services/invitations.service';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: string;
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-7 bg-gray-100 rounded w-16" />
        <div className="h-2 bg-gray-100 rounded w-32" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale de la plateforme Lootopia</p>
      </div>

      {/* Métriques principales */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Utilisateurs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Partenaires"
                value={stats?.partner_count ?? 0}
                sub="Comptes organisateurs actifs"
                color="bg-orange-50 text-orange-500"
                icon="🏢"
              />
              <StatCard
                label="Joueurs"
                value={stats?.player_count ?? 0}
                sub="Comptes joueurs enregistrés"
                color="bg-blue-50 text-blue-500"
                icon="🎮"
              />
              <StatCard
                label="Invitations en attente"
                value={pendingInvitations}
                sub="Liens non encore utilisés"
                color="bg-yellow-50 text-yellow-500"
                icon="✉️"
              />
            </>
          )}
        </div>
      </div>

      {/* Métriques chasses */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Chasses</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Total chasses"
                value={stats?.hunt_count ?? 0}
                sub="Actives + brouillons"
                color="bg-purple-50 text-purple-500"
                icon="🗺️"
              />
              <StatCard
                label="Chasses actives"
                value={stats?.active_hunt_count ?? 0}
                sub="Visibles des joueurs"
                color="bg-green-50 text-green-500"
                icon="✅"
              />
              <StatCard
                label="Participations"
                value={stats?.participant_count ?? 0}
                sub="Chasses rejointes au total"
                color="bg-indigo-50 text-indigo-500"
                icon="🏃"
              />
              <StatCard
                label="Taux de complétion"
                value={`${stats?.completion_rate ?? 0} %`}
                sub={`${stats?.completed_count ?? 0} chasses terminées`}
                color={
                  (stats?.completion_rate ?? 0) >= 50
                    ? 'bg-green-50 text-green-500'
                    : 'bg-red-50 text-red-400'
                }
                icon="🏆"
              />
            </>
          )}
        </div>
      </div>

      {/* Invitations récentes */}
      {invitations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Invitations récentes
          </p>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Organisation</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Envoyée le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.slice(0, 5).map((inv) => {
                  const status = invitationStatus(inv);
                  const badge = {
                    pending: { label: 'En attente', cls: 'bg-yellow-100 text-yellow-700' },
                    used: { label: 'Utilisée', cls: 'bg-green-100 text-green-700' },
                    expired: { label: 'Expirée', cls: 'bg-red-100 text-red-600' },
                  }[status];
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{inv.email}</td>
                      <td className="px-6 py-3 text-gray-500">{inv.partner_name ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {new Date(inv.created_at).toLocaleDateString('fr-FR')}
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
