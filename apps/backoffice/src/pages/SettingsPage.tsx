import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { profileService, type UpdateProfilePayload } from '@/services/profile.service';
import { filesService } from '@/services/files.service';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/ui/file-upload';

// ─── Profile form ────────────────────────────────────────────────────────────

interface ProfileFormValues {
  display_name: string;
  description: string;
  logo_url: string;
}

function ProfileSection() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoInit, setLogoInit] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => profileService.getMe(),
    staleTime: 60_000,
    // Seed the logo state once data arrives
    select: (d) => {
      if (!logoInit) {
        setLogoUrl(d.logo_url ?? undefined);
        setLogoInit(true);
      }
      return d;
    },
  });

  const { register, handleSubmit, formState: { isDirty } } = useForm<ProfileFormValues>({
    values: {
      display_name: profile?.display_name ?? '',
      description: profile?.description ?? '',
      logo_url: profile?.logo_url ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function onSubmit(values: ProfileFormValues) {
    mutation.mutate({
      display_name: values.display_name || undefined,
      description: values.description || undefined,
      logo_url: logoUrl ?? null,
    });
  }

  if (isLoading) {
    return <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('settings.profileSection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Logo */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('settings.logoLabel')}</label>
            <FileUpload
              value={logoUrl}
              onChange={(url: string | null) => setLogoUrl(url ?? undefined)}
              accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
              label={t('settings.logoUpload')}
            />
          </div>

          {/* Display name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('settings.displayNameLabel')}</label>
            <input
              {...register('display_name')}
              placeholder={t('settings.displayNamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('settings.descriptionLabel')}</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder={t('settings.descriptionPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('settings.emailLabel')}</label>
            <input
              value={profile?.email ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">{t('settings.emailReadonly')}</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? t('settings.saving') : t('settings.save')}
            </button>
            {saved && <span className="text-sm text-green-600">{t('settings.saved')}</span>}
            {mutation.isError && (
              <span className="text-sm text-red-500">{t('settings.saveError')}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Password form ────────────────────────────────────────────────────────────

interface PasswordFormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

function PasswordSection() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordFormValues>();

  const mutation = useMutation({
    mutationFn: profileService.updatePassword,
    onSuccess: () => {
      reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function onSubmit(values: PasswordFormValues) {
    mutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('settings.passwordSection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <Field label={t('settings.currentPassword')} error={errors.current_password?.message}>
            <input
              type="password"
              autoComplete="current-password"
              {...register('current_password', { required: t('settings.fieldRequired') })}
              className="field"
            />
          </Field>

          <Field label={t('settings.newPassword')} error={errors.new_password?.message}>
            <input
              type="password"
              autoComplete="new-password"
              {...register('new_password', {
                required: t('settings.fieldRequired'),
                minLength: { value: 8, message: t('settings.passwordMin') },
              })}
              className="field"
            />
          </Field>

          <Field label={t('settings.confirmPassword')} error={errors.confirm_password?.message}>
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirm_password', {
                required: t('settings.fieldRequired'),
                validate: (v) => v === watch('new_password') || t('settings.passwordMismatch'),
              })}
              className="field"
            />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? t('settings.updating') : t('settings.update')}
            </button>
            {saved && <span className="text-sm text-green-600">{t('settings.passwordUpdated')}</span>}
            {mutation.isError && (
              <span className="text-sm text-red-500">{t('settings.passwordError')}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Danger zone ─────────────────────────────────────────────────────────────

function DangerSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: profileService.deleteAccount,
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-red-600">{t('settings.dangerSection')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Logout */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{t('settings.logoutTitle')}</p>
            <p className="text-xs text-gray-400">{t('settings.logoutDesc')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('settings.logoutBtn')}
          </button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{t('settings.deleteTitle')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('settings.deleteDesc')}</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="shrink-0 px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            {t('settings.deleteBtn')}
          </button>
        </div>

        {showConfirm && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">{t('settings.deleteConfirmPrompt')}</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('settings.deleteConfirmWord')}
              className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={confirmText !== t('settings.deleteConfirmWord') || deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {deleteMutation.isPending ? t('settings.deleting') : t('settings.deleteConfirmBtn')}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <style>{`.field { width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; } .field:focus { box-shadow: 0 0 0 2px rgb(79 82 200 / 0.3); }`}</style>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      <ProfileSection />
      <PasswordSection />
      <DangerSection />
    </div>
  );
}
