import { useAuthStore } from '../store/auth.store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Tableau de bord</h2>
      <p className="text-sm text-gray-500 mb-6">
        Bienvenue{user?.email ? `, ${user.email}` : ''}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Chasses actives" value="—" />
        <StatCard label="Participants" value="—" />
        <StatCard label="Taux de complétion" value="—" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-semibold text-gray-800">{value}</span>
    </div>
  );
}
