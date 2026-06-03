import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirm: string;
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>();

  if (!token) {
    return <Navigate to="/login?error=invitation_required" replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await authService.registerPartner({
        token,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      navigate('/login?success=account_created');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setServerError("Ce lien d'invitation a déjà été utilisé.");
      } else if (status === 400) {
        setServerError("Ce lien d'invitation a expiré. Contactez votre administrateur.");
      } else if (status === 404) {
        setServerError("Lien d'invitation invalide. Vérifiez l'URL.");
      } else {
        setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lootopia</h1>
        <p className="text-sm text-gray-500 mb-6">Création de votre compte partenaire</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('firstName', { required: 'Le prénom est requis.' })}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('lastName', { required: 'Le nom est requis.' })}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('password', {
                required: 'Le mot de passe est requis.',
                minLength: { value: 8, message: '8 caractères minimum.' },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('passwordConfirm', {
                required: 'La confirmation est requise.',
                validate: (v) => v === watch('password') || 'Les mots de passe ne correspondent pas.',
              })}
            />
            {errors.passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
