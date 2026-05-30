import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { CreateZonePayload, ZoneDto, ZoneShape, ZoneShapeType } from '@/services/zones.service';
import ZoneCanvas from './ZoneCanvas';

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
  planUrl?: string;
  existingZones?: ZoneDto[];
}

function toPayload(v: ZoneFormValues, canvasShape?: ZoneShape | null): CreateZonePayload {
  let shape: ZoneShape;
  if (canvasShape) {
    shape = canvasShape;
  } else if (v.shapeType === 'rect') {
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
  planUrl,
  existingZones = [],
}: ZoneFormProps) {
  const canvasShapeRef = useRef<ZoneShape | null>(null);
  const { register, handleSubmit, control, setValue } = useForm<ZoneFormValues>({
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  const shapeType = useWatch({ control, name: 'shapeType' });
  const hasCanvas = Boolean(planUrl);

  const handleExternalShape = (shape: ZoneShape) => {
    canvasShapeRef.current = shape;
    if (shape.type === 'rect') {
      setValue('x', String(shape.x ?? 0));
      setValue('y', String(shape.y ?? 0));
      setValue('width', String(shape.width ?? 0));
      setValue('height', String(shape.height ?? 0));
    } else if (shape.type === 'circle') {
      setValue('cx', String(shape.cx ?? 0));
      setValue('cy', String(shape.cy ?? 0));
      setValue('radius', String(shape.radius ?? 0));
    }
    setValue('shapeType', shape.type);
  };

  const handleFormSubmit = async (values: ZoneFormValues) => {
    const canvasShape = hasCanvas ? canvasShapeRef.current : null;
    await onSubmit(toPayload(values, canvasShape));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {planUrl && (
        <ZoneCanvas
          planUrl={planUrl}
          zones={existingZones}
          shapeType={shapeType ?? 'rect'}
          onShapeCommit={handleExternalShape}
        />
      )}

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
            <Label htmlFor="zone-x">X</Label>
            <Input id="zone-x" type="number" step="any" readOnly={hasCanvas} {...register('x')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-y">Y</Label>
            <Input id="zone-y" type="number" step="any" readOnly={hasCanvas} {...register('y')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-width">Largeur</Label>
            <Input id="zone-width" type="number" step="any" min={1} readOnly={hasCanvas} {...register('width')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-height">Hauteur</Label>
            <Input id="zone-height" type="number" step="any" min={1} readOnly={hasCanvas} {...register('height')} />
          </div>
        </div>
      )}

      {shapeType === 'circle' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="zone-cx">Centre X</Label>
            <Input id="zone-cx" type="number" step="any" readOnly={hasCanvas} {...register('cx')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-cy">Centre Y</Label>
            <Input id="zone-cy" type="number" step="any" readOnly={hasCanvas} {...register('cy')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone-radius">Rayon (px)</Label>
            <Input id="zone-radius" type="number" step="any" min={1} readOnly={hasCanvas} {...register('radius')} />
          </div>
        </div>
      )}

      {shapeType === 'polygon' && planUrl && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          Cliquez pour ajouter des points. Cliquez sur le point de départ{' '}
          <span className="inline-block w-3 h-3 rounded-full bg-amber-400 align-middle" />{' '}
          (ou double-cliquez) pour fermer le polygone.
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
