import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { huntsService, type HuntDto } from '@/services/hunts.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function HuntsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
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

  const diffLabel = (d?: string) => {
    if (d === 'easy') return t('hunts.diffEasy');
    if (d === 'medium') return t('hunts.diffMedium');
    if (d === 'hard') return t('hunts.diffHard');
    return d ?? '—';
  };

  const activeHunts = hunts.filter((h) => h.is_active);
  const draftHunts = hunts.filter((h) => !h.is_active);

  const huntRows = (list: HuntDto[]) =>
    list.map((hunt) => (
      <TableRow key={hunt.id}>
        <TableCell>
          <div>
            <p className="font-medium text-gray-900">{hunt.title}</p>
            {hunt.location && <p className="text-xs text-gray-400 mt-0.5">{hunt.location}</p>}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-gray-600">{diffLabel(hunt.difficulty)}</span>
        </TableCell>
        <TableCell>
          {hunt.duration ? <span className="text-sm text-gray-600">{hunt.duration} {t('hunts.min')}</span> : <span className="text-xs text-gray-400">—</span>}
        </TableCell>
        <TableCell>
          <span className="text-sm font-medium text-gray-700">{hunt.points} {t('hunts.pts')}</span>
        </TableCell>
        <TableCell>
          <Badge variant={hunt.is_active ? 'success' : 'warning'}>
            {hunt.is_active ? t('hunts.statusActive') : t('hunts.statusInactive')}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hunts/${hunt.id}/steps`)} title={t('hunts.tooltipSteps')}>
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hunts/${hunt.id}/edit`)} title={t('hunts.tooltipEdit')}>
              <Pencil className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(hunt)} title={t('hunts.tooltipDelete')}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('hunts.title')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t('hunts.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/hunts/new')}>
          <Plus className="h-4 w-4" />
          {t('hunts.createBtn')}
        </Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('hunts.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">{t('common.loading')}</div>
      ) : hunts.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {t('hunts.noHunts')}{' '}
          <button className="text-primary hover:underline" onClick={() => navigate('/hunts/new')}>
            {t('hunts.noHuntsCreate')}
          </button>.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {t('hunts.sectionActive')}
                <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{activeHunts.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeHunts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('hunts.noActive')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hunts.colHunt')}</TableHead>
                      <TableHead>{t('hunts.colDifficulty')}</TableHead>
                      <TableHead>{t('hunts.colDuration')}</TableHead>
                      <TableHead>{t('hunts.colPoints')}</TableHead>
                      <TableHead>{t('hunts.colStatus')}</TableHead>
                      <TableHead className="text-right">{t('hunts.colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{huntRows(activeHunts)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {t('hunts.sectionDraft')}
                <span className="text-xs font-normal bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{draftHunts.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {draftHunts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{t('hunts.noDraft')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('hunts.colHunt')}</TableHead>
                      <TableHead>{t('hunts.colDifficulty')}</TableHead>
                      <TableHead>{t('hunts.colDuration')}</TableHead>
                      <TableHead>{t('hunts.colPoints')}</TableHead>
                      <TableHead>{t('hunts.colStatus')}</TableHead>
                      <TableHead className="text-right">{t('hunts.colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{huntRows(draftHunts)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hunts.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('hunts.deleteDesc', { title: deleteTarget?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? t('hunts.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
