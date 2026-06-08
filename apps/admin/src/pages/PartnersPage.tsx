import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminService, type Partner } from '../services/admin.service';

export default function PartnersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: adminService.getPartners,
    staleTime: 30_000,
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => adminService.blockPartner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-partners'] }); setConfirmId(null); },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => adminService.unblockPartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-partners'] }),
  });

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.pseudo?.toLowerCase().includes(q);
  });

  const confirmTarget = partners.find((p) => p.id === confirmId);

  function statusBadge(p: Partner) {
    if (p.is_blocked) return { label: t('partners.statusSuspended'), cls: 'bg-red-100 text-red-700' };
    if (p.hunt_count === 0) return { label: t('partners.statusInactive'), cls: 'bg-gray-100 text-gray-500' };
    if (p.hunt_count < 3) return { label: t('partners.statusActive'), cls: 'bg-green-100 text-green-700' };
    return { label: t('partners.statusVeryActive'), cls: 'bg-blue-100 text-blue-700' };
  }

  const suspendedCount = partners.filter((p) => p.is_blocked).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('partners.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('partners.subtitle_other', { count: partners.length })}
            {suspendedCount > 0 && (
              <span className="ml-2 text-red-500">
                {t('partners.suspended_other', { count: suspendedCount })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/invitations')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {t('partners.inviteBtn')}
        </button>
      </div>

      <input
        type="text"
        placeholder={t('partners.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">{t('common.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-sm text-gray-500">
              {search ? t('partners.noSearch') : t('partners.noPartners')}
            </p>
            {!search && (
              <button onClick={() => navigate('/invitations')} className="mt-4 text-sm text-orange-500 hover:underline">
                {t('partners.firstInvite')}
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">{t('partners.colPartner')}</th>
                <th className="px-6 py-3 text-left">{t('partners.colStatus')}</th>
                <th className="px-6 py-3 text-right">{t('partners.colHunts')}</th>
                <th className="px-6 py-3 text-right">{t('partners.colActive')}</th>
                <th className="px-6 py-3 text-left">{t('partners.colSince')}</th>
                <th className="px-6 py-3 text-right">{t('partners.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p: Partner) => {
                const badge = statusBadge(p);
                const initials = (p.pseudo ?? p.email ?? '?')
                  .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.is_blocked ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.is_blocked ? 'bg-red-100 text-red-400' : 'bg-orange-100 text-orange-600'}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {p.pseudo ?? <span className="text-gray-400 italic">{t('partners.noName')}</span>}
                          </p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">{p.hunt_count}</td>
                    <td className="px-6 py-4 text-right">
                      {p.active_hunt_count > 0
                        ? <span className="font-semibold text-green-600">{p.active_hunt_count}</span>
                        : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.is_blocked ? (
                        <button
                          disabled={unblockMutation.isPending}
                          onClick={() => unblockMutation.mutate(p.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                        >
                          {t('partners.reactivate')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmId(p.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          {t('partners.suspend')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {confirmId && confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t('partners.confirmTitle')}</h3>
            <p className="text-sm text-gray-600 mb-5">
              {t('partners.confirmDescBefore')}{' '}
              <strong>{confirmTarget.pseudo ?? confirmTarget.email}</strong>
              {t('partners.confirmDescAfter')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={blockMutation.isPending}
                onClick={() => blockMutation.mutate(confirmId)}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {blockMutation.isPending ? t('partners.suspending') : t('partners.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
