import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { huntsService, type CreateHuntPayload } from '@/services/hunts.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HuntForm from '@/components/hunt/HuntForm';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const TEMPLATE_COLORS: Record<string, string> = {
  'urban-explorer': 'bg-blue-500',
  'history-trail': 'bg-amber-500',
  'nature-challenge': 'bg-green-500',
  'family-fun': 'bg-purple-500',
};

type Mode = 'form' | 'templates';

export default function HuntCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('form');

  const { data: templates = [] } = useQuery({
    queryKey: ['hunt-templates'],
    queryFn: huntsService.getTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateHuntPayload) => huntsService.create(payload),
    onSuccess: (hunt) => {
      qc.invalidateQueries({ queryKey: ['hunts'] });
      navigate(`/hunts/${hunt.id}/edit`);
    },
  });

  const fromTemplateMutation = useMutation({
    mutationFn: (templateId: string) => huntsService.createFromTemplate(templateId),
    onSuccess: (hunt) => {
      qc.invalidateQueries({ queryKey: ['hunts'] });
      navigate(`/hunts/${hunt.id}/edit`);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/hunts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Créer une chasse</h2>
          <p className="text-sm text-gray-500">Nouvelle chasse au trésor</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'form' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('form')}
        >
          Nouvelle chasse
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            mode === 'templates' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setMode('templates')}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Depuis un template
        </button>
      </div>

      {mode === 'form' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations de la chasse</CardTitle>
          </CardHeader>
          <CardContent>
            <HuntForm
              onSubmit={(payload) => createMutation.mutateAsync(payload)}
              isLoading={createMutation.isPending}
              submitLabel="Créer la chasse"
            />
            {createMutation.isError && (
              <p className="mt-3 text-sm text-red-500 text-center">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Démarrez depuis un template préconfigurée. Vous pourrez personnaliser tous les détails ensuite.
          </p>
          {templates.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Chargement des templates…</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  disabled={fromTemplateMutation.isPending}
                  onClick={() => fromTemplateMutation.mutate(tpl.id)}
                  className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-sm transition-all disabled:opacity-50"
                >
                  <div
                    className={`h-10 w-10 rounded-lg ${TEMPLATE_COLORS[tpl.id] ?? 'bg-gray-400'} mb-3`}
                  />
                  <p className="font-semibold text-gray-900 text-sm">{tpl.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span>{DIFFICULTY_LABELS[tpl.difficulty] ?? tpl.difficulty}</span>
                    <span>·</span>
                    <span>{tpl.duration} min</span>
                    <span>·</span>
                    <span>{tpl.points} pts</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {fromTemplateMutation.isError && (
            <p className="text-sm text-red-500 text-center">
              Erreur lors de la création depuis le template.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
