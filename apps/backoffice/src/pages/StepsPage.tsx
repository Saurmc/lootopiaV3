import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Layers } from 'lucide-react';
import { huntsService } from '@/services/hunts.service';
import { stepsService, type StepDto } from '@/services/steps.service';
import { zonesService, type ZoneDto } from '@/services/zones.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import StepForm, { stepDtoToFormValues } from '@/components/step/StepForm';
import ZoneForm, { zoneDtoToFormValues } from '@/components/zone/ZoneForm';

type Tab = 'steps' | 'zones';

const VALIDATION_TYPE_STYLES: Record<string, string> = {
  gps: 'bg-blue-100 text-blue-700',
  qrcode: 'bg-violet-100 text-violet-700',
  quiz: 'bg-orange-100 text-orange-700',
  photo: 'bg-green-100 text-green-700',
};

function ValidationTypeBadge({ type }: { type?: string }) {
  const label = type ?? 'gps';
  const cls = VALIDATION_TYPE_STYLES[label] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function StepsPage() {
  const { id: huntId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('steps');
  const [stepDialog, setStepDialog] = useState<'create' | StepDto | null>(null);
  const [zoneDialog, setZoneDialog] = useState<'create' | ZoneDto | null>(null);
  const [deleteStepTarget, setDeleteStepTarget] = useState<StepDto | null>(null);
  const [deleteZoneTarget, setDeleteZoneTarget] = useState<ZoneDto | null>(null);

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

  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ['zones', huntId],
    queryFn: () => zonesService.getAll(huntId!),
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

  const createZone = useMutation({
    mutationFn: (p: Parameters<typeof zonesService.create>[1]) =>
      zonesService.create(huntId!, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones', huntId] });
      setZoneDialog(null);
    },
  });

  const updateZone = useMutation({
    mutationFn: ({ zoneId, payload }: { zoneId: string; payload: Parameters<typeof zonesService.update>[2] }) =>
      zonesService.update(huntId!, zoneId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones', huntId] });
      setZoneDialog(null);
    },
  });

  const deleteZone = useMutation({
    mutationFn: (zoneId: string) => zonesService.remove(huntId!, zoneId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones', huntId] });
      setDeleteZoneTarget(null);
    },
  });

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const sortedZones = [...zones].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/hunts/${huntId}/edit`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Étapes & Zones</h2>
          {hunt && <p className="text-sm text-gray-500 truncate max-w-xs">{hunt.title}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'steps' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('steps')}
        >
          <MapPin className="h-3.5 w-3.5" />
          Étapes
          <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${tab === 'steps' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
            {steps.length}
          </span>
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'zones' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('zones')}
        >
          <Layers className="h-3.5 w-3.5" />
          Zones
          <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${tab === 'zones' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
            {zones.length}
          </span>
        </button>
      </div>

      {/* Steps tab */}
      {tab === 'steps' && (
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                        <ValidationTypeBadge type={step.validation_type} />
                      </div>
                      {step.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{step.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Rayon : {step.validation_radius} m
                      </p>
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
      )}

      {/* Zones tab */}
      {tab === 'zones' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Zones de la chasse</CardTitle>
              <Button size="sm" onClick={() => setZoneDialog('create')}>
                <Plus className="h-4 w-4" />
                Ajouter une zone
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {zonesLoading ? (
              <div className="py-10 text-center text-sm text-gray-400">Chargement…</div>
            ) : sortedZones.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Aucune zone.{' '}
                <button className="text-primary hover:underline" onClick={() => setZoneDialog('create')}>
                  Ajoutez-en une
                </button>
                .
              </div>
            ) : (
              <ul className="divide-y">
                {sortedZones.map((zone) => (
                  <li key={zone.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {zone.label ?? <span className="text-gray-400 italic">Sans label</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {zone.shape.type}
                        {zone.shape.type === 'rect' && ` — ${zone.shape.width}×${zone.shape.height}px`}
                        {zone.shape.type === 'circle' && ` — r=${zone.shape.radius}px`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="Modifier" onClick={() => setZoneDialog(zone)}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Supprimer" onClick={() => setDeleteZoneTarget(zone)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step create/edit dialog */}
      <Dialog open={stepDialog !== null} onOpenChange={(open) => !open && setStepDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stepDialog === 'create' ? "Nouvelle étape" : "Modifier l'étape"}
            </DialogTitle>
          </DialogHeader>
          <StepForm
            defaultValues={stepDialog !== 'create' && stepDialog ? stepDtoToFormValues(stepDialog) : undefined}
            isLoading={createStep.isPending || updateStep.isPending}
            submitLabel={stepDialog === 'create' ? "Créer l'étape" : 'Enregistrer'}
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

      {/* Zone create/edit dialog */}
      <Dialog open={zoneDialog !== null} onOpenChange={(open) => !open && setZoneDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {zoneDialog === 'create' ? 'Nouvelle zone' : 'Modifier la zone'}
            </DialogTitle>
          </DialogHeader>
          <ZoneForm
            defaultValues={zoneDialog !== 'create' && zoneDialog ? zoneDtoToFormValues(zoneDialog) : undefined}
            isLoading={createZone.isPending || updateZone.isPending}
            submitLabel={zoneDialog === 'create' ? 'Créer la zone' : 'Enregistrer'}
            onSubmit={(payload) => {
              if (zoneDialog === 'create') return createZone.mutateAsync(payload);
              return updateZone.mutateAsync({ zoneId: (zoneDialog as ZoneDto).id, payload });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Zone delete dialog */}
      <Dialog open={deleteZoneTarget !== null} onOpenChange={(open) => !open && setDeleteZoneTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la zone</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Supprimer la zone{' '}
            <span className="font-medium text-gray-900">{deleteZoneTarget?.label ?? 'sans label'}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteZoneTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteZone.isPending}
              onClick={() => deleteZoneTarget && deleteZone.mutate(deleteZoneTarget.id)}
            >
              {deleteZone.isPending ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
