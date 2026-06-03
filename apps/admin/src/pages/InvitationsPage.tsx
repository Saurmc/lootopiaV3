import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  invitationsService,
  invitationStatus,
  type Invitation,
} from '../services/invitations.service';

interface InviteFormValues {
  email: string;
  partnerName?: string;
}

export default function InvitationsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
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
      setSuccessMsg(t('invitations.successMsg', { email: res.email }));
      reset();
    },
    onError: (err: { response?: { status?: number } }) => {
      setServerError(
        err.response?.status === 409 ? t('invitations.errorDuplicate') : t('invitations.errorGeneric'),
      );
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

  const statusLabel = (inv: Invitation) => {
    const status = invitationStatus(inv);
    return {
      pending: { label: t('invitations.statusPending'), cls: 'bg-yellow-100 text-yellow-800' },
      used:    { label: t('invitations.statusUsed'),    cls: 'bg-green-100 text-green-800' },
      expired: { label: t('invitations.statusExpired'), cls: 'bg-red-100 text-red-800' },
    }[status];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-xl font-bold text-gray-900">{t('invitations.title')}</h1>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">{t('invitations.formTitle')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('invitations.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t('invitations.emailPlaceholder')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                {...register('email', {
                  required: t('invitations.emailRequired'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('invitations.emailInvalid') },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="flex-1">
              <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('invitations.orgLabel')}
              </label>
              <input
                id="partnerName"
                type="text"
                placeholder={t('invitations.orgPlaceholder')}
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
            {isPending ? t('invitations.sending') : t('invitations.sendBtn')}
          </button>
        </form>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            {t('invitations.listTitle', { count: invitations.length })}
          </h2>
        </div>

        {isLoading ? (
          <p className="px-6 py-8 text-sm text-gray-500">{t('common.loading')}</p>
        ) : invitations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">{t('invitations.noInvitations')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">{t('invitations.colEmail')}</th>
                <th className="px-6 py-3 text-left">{t('invitations.colOrg')}</th>
                <th className="px-6 py-3 text-left">{t('invitations.colStatus')}</th>
                <th className="px-6 py-3 text-left">{t('invitations.colExpires')}</th>
                <th className="px-6 py-3 text-left">{t('invitations.colSentAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv: Invitation) => {
                const badge = statusLabel(inv);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{inv.email}</td>
                    <td className="px-6 py-3 text-gray-500">{inv.partner_name ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString()}
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
