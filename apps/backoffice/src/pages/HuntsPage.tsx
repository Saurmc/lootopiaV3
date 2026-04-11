import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { huntsService, type HuntDto } from '@/services/hunts.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function HuntsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HuntDto | null>(null);

  const { data: hunts = [], isLoading } = useQuery({
    queryKey: ['hunts', search],
    queryFn: () => huntsService.getAll(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => huntsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hunts'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Chasses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos chasses au trésor</p>
        </div>
        <Button onClick={() => navigate('/hunts/new')}>
          <Plus className="h-4 w-4" />
          Créer une chasse
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chasses Actives</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>
          ) : hunts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Aucune chasse trouvée.{' '}
              <button className="text-primary hover:underline" onClick={() => navigate('/hunts/new')}>
                Créez-en une
              </button>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chasse</TableHead>
                  <TableHead>Difficulté</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hunts.map((hunt) => (
                  <HuntRow
                    key={hunt.id}
                    hunt={hunt}
                    onEdit={() => navigate(`/hunts/${hunt.id}/edit`)}
                    onView={() => navigate(`/hunts/${hunt.id}/steps`)}
                    onDelete={() => setDeleteTarget(hunt)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la chasse</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-medium text-gray-900">{deleteTarget?.title}</span> ? Cette
              action supprimera toutes les étapes, zones et progressions associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HuntRow({
  hunt,
  onEdit,
  onView,
  onDelete,
}: {
  hunt: HuntDto;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-gray-900">{hunt.title}</p>
          {hunt.location && <p className="text-xs text-gray-400 mt-0.5">{hunt.location}</p>}
        </div>
      </TableCell>
      <TableCell>
        {hunt.difficulty ? (
          <span className="text-sm text-gray-600">
            {DIFFICULTY_LABELS[hunt.difficulty] ?? hunt.difficulty}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell>
        {hunt.duration ? (
          <span className="text-sm text-gray-600">{hunt.duration} min</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-gray-700">{hunt.points} pts</span>
      </TableCell>
      <TableCell>
        <Badge variant={hunt.is_active ? 'success' : 'warning'}>
          {hunt.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onView} title="Voir les étapes">
            <Eye className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title="Modifier">
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Supprimer">
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
