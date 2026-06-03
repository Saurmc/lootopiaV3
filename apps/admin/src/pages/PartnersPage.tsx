import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService, type Partner } from '../services/admin.service';

function statusBadge(huntCount: number) {
  if (huntCount === 0) return { label: 'Inactif', cls: 'bg-gray-100 text-gray-500' };
  if (huntCount < 3) return { label: 'Actif', cls: 'bg-green-100 text-green-700' };
  return { label: 'Très actif', cls: 'bg-blue-100 text-blue-700' };
}

export default function PartnersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: adminService.getPartners,
    staleTime: 30_000,
  });

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.email?.toLowerCase().includes(q) ||
      p.pseudo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
          <p className="text-sm text-gray-500 mt-1">
            {partners.length} compte{partners.length > 1 ? 's' : ''} partenaire{partners.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/invitations')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Inviter un partenaire
        </button>
      </div>

      {/* Recherche */}
      <div>
        <input
          type="text"
          placeholder="Rechercher par email ou nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-sm text-gray-500">
              {search ? 'Aucun partenaire trouvé.' : 'Aucun partenaire pour l\'instant.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/invitations')}
                className="mt-4 text-sm text-orange-500 hover:underline"
              >
                Envoyer une première invitation
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Partenaire</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-right">Chasses totales</th>
                <th className="px-6 py-3 text-right">Chasses actives</th>
                <th className="px-6 py-3 text-left">Membre depuis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p: Partner) => {
                const badge = statusBadge(p.hunt_count);
                const initials = (p.pseudo ?? p.email ?? '?')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {p.pseudo ?? <span className="text-gray-400 italic">Sans nom</span>}
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
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-800">{p.hunt_count}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.active_hunt_count > 0 ? (
                        <span className="font-semibold text-green-600">{p.active_hunt_count}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
