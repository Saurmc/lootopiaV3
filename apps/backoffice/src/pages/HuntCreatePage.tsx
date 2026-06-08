import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wand2, Clock, Star, ChevronRight } from 'lucide-react';
import { huntsService, type CreateHuntPayload } from '@/services/hunts.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HuntForm from '@/components/hunt/HuntForm';

const DIFFICULTY_LABELS: Record<string, { label: string; cls: string }> = {
  easy:   { label: 'Facile',    cls: 'bg-green-50 text-green-700' },
  medium: { label: 'Moyen',     cls: 'bg-amber-50 text-amber-700' },
  hard:   { label: 'Difficile', cls: 'bg-red-50 text-red-600' },
};

type Mode = 'form' | 'templates';

export default function HuntCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('form');

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['hunt-templates'],
    queryFn: huntsService.getTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateHuntPayload) => huntsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hunts'] });
      navigate('/hunts');
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
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Démarrez depuis un modèle préconfigurée. Tous les détails (titre, étapes, etc.) restent modifiables ensuite.
          </p>

          {templatesLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((tpl) => {
                const diff = tpl.defaults?.difficulty;
                const diffStyle = DIFFICULTY_LABELS[diff] ?? { label: diff, cls: 'bg-gray-100 text-gray-500' };
                return (
                  <button
                    key={tpl.id}
                    disabled={fromTemplateMutation.isPending}
                    onClick={() => fromTemplateMutation.mutate(tpl.id)}
                    className="group text-left p-5 bg-white rounded-2xl border border-gray-200 hover:border-[#4B49B8] hover:shadow-md transition-all disabled:opacity-50 flex flex-col gap-3"
                  >
                    {/* Icon + title */}
                    <div className="flex items-start gap-3">
                      <span className="text-3xl leading-none">{tpl.icon ?? '🗺️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{tpl.name}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.description}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${diffStyle.cls}`}>
                        {diffStyle.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {tpl.defaults?.duration ?? '—'} min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Star className="h-3 w-3" />
                        {tpl.defaults?.points ?? '—'} pts
                      </span>
                    </div>

                    {/* Steps hint */}
                    {tpl.stepsHint && tpl.stepsHint.length > 0 && (
                      <div className="border-t border-gray-50 pt-2 space-y-1">
                        {tpl.stepsHint.slice(0, 3).map((hint, i) => (
                          <p key={i} className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#4B49B8]/10 text-[#4B49B8] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="line-clamp-1">{hint}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center justify-end gap-1 text-[#4B49B8] text-xs font-medium group-hover:gap-2 transition-all mt-auto">
                      Utiliser ce template
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
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
