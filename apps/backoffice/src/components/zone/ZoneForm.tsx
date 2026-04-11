import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { CreateZonePayload, ZoneDto, ZoneShape, ZoneShapeType } from '@/services/zones.service';

export interface ZoneFormValues {
  label: string;
  order: string;
  shapeType: ZoneShapeType;
  // rect
  x: string;
  y: string;
  width: string;
  height: string;
  // circle
  cx: string;
  cy: string;
  radius: string;
}

interface ZoneFormProps {
  defaultValues?: ZoneFormValues;
  onSubmit: (payload: CreateZonePayload) => Promise<unknown>;
  isLoading?: boolean;
  submitLabel?: string;
}

function toPayload(v: ZoneFormValues): CreateZonePayload {
  let shape: ZoneShape;
  if (v.shapeType === 'rect') {
    shape = {
      type: 'rect',
      x: parseFloat(v.x) || 0,
      y: parseFloat(v.y) || 0,
      width: parseFloat(v.width) || 0,
      height: parseFloat(v.height) || 0,
    };
  } else if (v.shapeType === 'circle') {
    shape = {
      type: 'circle',
      cx: parseFloat(v.cx) || 0,
      cy: parseFloat(v.cy) || 0,
      radius: parseFloat(v.radius) || 0,
    };
  } else {
    shape = { type: 'polygon', points: [] };
  }
  const payload: CreateZonePayload = { shape };
  if (v.label.trim()) payload.label = v.label.trim();
  const order = parseInt(v.order, 10);
  if (!isNaN(order)) payload.order = order;
  return payload;
}

export function zoneDtoToFormValues(zone: ZoneDto): ZoneFormValues {
  const s = zone.shape;
  return {
    label: zone.label ?? '',
    order: String(zone.order),
    shapeType: s.type,
    x: String(s.x ?? ''),
    y: String(s.y ?? ''),
    width: String(s.width ?? ''),
    height: String(s.height ?? ''),
    cx: String(s.cx ?? ''),
    cy: String(s.cy ?? ''),
    radius: String(s.radius ?? ''),
  };
}

const DEFAULT_VALUES: ZoneFormValues = {
  label: '',
  order: '0',
  shapeType: 'rect',
  x: '0', y: '0', width: '100', height: '80',
  cx: '0', cy: '0', radius: '50',
};

export default function ZoneForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Enregistrer',
}: ZoneFormProps) {
  const { register, handleSubmit, control, setValue } = useForm<ZoneFormValues>({
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  const shapeType = useWatch({ control, name: 'shapeType' });

  const handleFormSubmit = async (values: ZoneFormValues) => {
    await onSubmit(toPayload(values));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="zone-label">Label</Label>
          <Input id="zone-label" placeholder="Ex : Entrée" {...register('label')} />
        </div>

        {/* Ordre */}
        <div className="space-y-1.5">
          <Label htmlFor="zone-order">Ordre</Label>
          <Input id="zone-order" type="number" min={0} {...register('order')} />
        </div>
      </div>

      {/* Type de forme */}
      <div className="space-y-1.5">
        <Label>Type de zone</Label>
        <Select
          defaultValue={defaultValues?.shapeType ?? 'rect'}
          onValueChange={(v) => setValue('shapeType', v as ZoneShapeType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rect">Rectangle</SelectItem>
            <SelectItem value="circle">Cercle</SelectItem>
            <SelectItem value="polygon">Polygone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Champs selon le type */}
      {shapeType === 'rect' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>X</Label>
            <Input type="number" step="any" {...register('x')} />
          </div>
          <div className="space-y-1.5">
            <Label>Y</Label>
            <Input type="number" step="any" {...register('y')} />
          </div>
          <div className="space-y-1.5">
            <Label>Largeur</Label>
            <Input type="number" step="any" min={1} {...register('width')} />
          </div>
          <div className="space-y-1.5">
            <Label>Hauteur</Label>
            <Input type="number" step="any" min={1} {...register('height')} />
          </div>
        </div>
      )}

      {shapeType === 'circle' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Centre X</Label>
            <Input type="number" step="any" {...register('cx')} />
          </div>
          <div className="space-y-1.5">
            <Label>Centre Y</Label>
            <Input type="number" step="any" {...register('cy')} />
          </div>
          <div className="space-y-1.5">
            <Label>Rayon (px)</Label>
            <Input type="number" step="any" min={1} {...register('radius')} />
          </div>
        </div>
      )}

      {shapeType === 'polygon' && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          L'éditeur de polygone sera disponible avec l'upload du plan (US44).
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
