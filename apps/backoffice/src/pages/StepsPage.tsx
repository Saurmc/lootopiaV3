import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { huntsService } from '@/services/hunts.service';
import { stepsService, type StepDto } from '@/services/steps.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import StepForm, { stepDtoToFormValues } from '@/components/step/StepForm';

export default function StepsPage() {
  const { id: huntId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [stepDialog, setStepDialog] = useState<'create' | StepDto | null>(null);
  const [deleteStepTarget, setDeleteStepTarget] = useState<StepDto | null>(null);

  const { data: hunt } = useQuery({
    queryKey: ['hunt', huntId],
    queryFn: () => huntsService.getById(huntId!),
    enabled: !!huntId,
  });

  const { data: steps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ['steps', huntId],
    queryFn: () => stepsService.getAll(huntId!),
    enabled: !!huntId,
  });

  const createStep = useMutation({
    mutationFn: (p: Parameters<typeof stepsService.create>[1]) =>
      stepsService.create(huntId!, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', huntId] });
      setStepDialog(null);
    },
  });

  const updateStep = useMutation({
    mutationFn: ({ stepId, payload }: { stepId: string; payload: Parameters<typeof stepsService.update>[2] }) =>
      stepsService.update(huntId!, stepId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', huntId] });
      setStepDialog(null);
    },
  });

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => stepsService.remove(huntId!, stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', huntId] });
      setDeleteStepTarget(null);
    },
  });

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/hunts/${huntId}/edit`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Étapes</h2>
          {hunt && <p className="text-sm text-gray-500 truncate max-w-xs">{hunt.title}</p>}
        </div>
      </div>

      {/* Steps list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Étapes de la chasse</CardTitle>
            <Button size="sm" onClick={() => setStepDialog('create')}>
              <Plus className="h-4 w-4" />
              Ajouter une étape
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stepsLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">Chargement…</div>
          ) : sortedSteps.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Aucune étape.{' '}
              <button className="text-primary hover:underline" onClick={() => setStepDialog('create')}>
                Ajoutez-en une
              </button>
              .
            </div>
          ) : (
            <ul className="divide-y">
              {sortedSteps.map((step) => (
                <li key={step.id} className="flex items-start gap-4 px-6 py-4">
                  <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {step.order + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{step.description}</p>
                    )}
                    {step.ar_content && (
                      <span className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700">
                        AR scan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" title="Modifier" onClick={() => setStepDialog(step)}>
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Supprimer" onClick={() => setDeleteStepTarget(step)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Step create/edit dialog */}
      <Dialog open={stepDialog !== null} onOpenChange={(open) => !open && setStepDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stepDialog === 'create' ? 'Nouvelle étape' : "Modifier l'étape"}
            </DialogTitle>
          </DialogHeader>
          <StepForm
            defaultValues={stepDialog !== 'create' && stepDialog ? stepDtoToFormValues(stepDialog) : undefined}
            isLoading={createStep.isPending || updateStep.isPending}
            submitLabel={stepDialog === 'create' ? "Créer l'étape" : 'Enregistrer'}
            huntId={huntId}
            stepId={stepDialog !== 'create' && stepDialog ? (stepDialog as StepDto).id : undefined}
            onSubmit={(payload) => {
              if (stepDialog === 'create') return createStep.mutateAsync(payload);
              return updateStep.mutateAsync({ stepId: (stepDialog as StepDto).id, payload });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Step delete dialog */}
      <Dialog open={deleteStepTarget !== null} onOpenChange={(open) => !open && setDeleteStepTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'étape</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Supprimer{' '}
            <span className="font-medium text-gray-900">{deleteStepTarget?.title}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteStepTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteStep.isPending}
              onClick={() => deleteStepTarget && deleteStep.mutate(deleteStepTarget.id)}
            >
              {deleteStep.isPending ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
