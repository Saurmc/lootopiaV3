import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invitationsService,
  invitationStatus,
  type Invitation,
} from '../services/invitations.service';

interface InviteFormValues {
  email: string;
  partnerName?: string;
}

const statusLabel: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  used: { label: 'Utilisée', className: 'bg-green-100 text-green-800' },
  expired: { label: 'Expirée', className: 'bg-red-100 text-red-800' },
};

export default function InvitationsPage() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: invitationsService.list,
  });

  const { mutateAsync: sendInvitation, isPending } = useMutation({
    mutationFn: invitationsService.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      setSuccessMsg(`Invitation envoyée à ${res.email}.`);
      reset();
    },
    onError: (err: { response?: { status?: number } }) => {
      if (err.response?.status === 409) {
        setServerError('Une invitation active existe déjà pour cet email.');
      } else {
        setServerError("Erreur lors de l'envoi de l'invitation.");
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>();

  const onSubmit = async (values: InviteFormValues) => {
    setServerError(null);
    setSuccessMsg(null);
    await sendInvitation({ email: values.email, partnerName: values.partnerName || undefined });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Invitations partenaires</h1>

      {/* Formulaire d'envoi */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Envoyer une invitation</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email du partenaire
              </label>
              <input
                id="email"
                type="email"
                placeholder="contact@musee.fr"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                {...register('email', {
                  required: "L'email est requis.",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide.' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'organisation (optionnel)
              </label>
              <input
                id="partnerName"
                type="text"
                placeholder="Musée du Louvre"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                {...register('partnerName')}
              />
            </div>
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Envoi…' : "Envoyer l'invitation"}
          </button>
        </form>
      </div>

      {/* Liste des invitations */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            Invitations envoyées ({invitations.length})
          </h2>
        </div>

        {isLoading ? (
          <p className="px-6 py-8 text-sm text-gray-500">Chargement…</p>
        ) : invitations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">Aucune invitation envoyée pour l'instant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Organisation</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-left">Expire le</th>
                <th className="px-6 py-3 text-left">Envoyée le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv: Invitation) => {
                const status = invitationStatus(inv);
                const badge = statusLabel[status];
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{inv.email}</td>
                    <td className="px-6 py-3 text-gray-500">{inv.partner_name ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString('fr-FR')}
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
