import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { huntsService, type CreateHuntPayload } from '@/services/hunts.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HuntForm, { huntDtoToFormValues } from '@/components/hunt/HuntForm';

export default function HuntEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: hunt, isLoading: isFetching } = useQuery({
    queryKey: ['hunt', id],
    queryFn: () => huntsService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateHuntPayload) => huntsService.update(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hunts'] });
      qc.invalidateQueries({ queryKey: ['hunt', id] });
      navigate('/hunts');
    },
  });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-500">
        Chasse introuvable.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hunts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Modifier la chasse</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs">{hunt.title}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/hunts/${id}/steps`)}>
          <ListChecks className="h-4 w-4" />
          Gérer les étapes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations de la chasse</CardTitle>
        </CardHeader>
        <CardContent>
          <HuntForm
            defaultValues={huntDtoToFormValues(hunt)}
            onSubmit={(payload) => updateMutation.mutateAsync(payload)}
            isLoading={updateMutation.isPending}
            submitLabel="Enregistrer les modifications"
          />
          {updateMutation.isError && (
            <p className="mt-3 text-sm text-red-500 text-center">
              Une erreur est survenue. Veuillez réessayer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
