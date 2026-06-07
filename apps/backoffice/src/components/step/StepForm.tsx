import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/ui/file-upload';
import type { CreateStepPayload, StepDto } from '@/services/steps.service';

export interface StepFormValues {
  order: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  validation_radius: string;
  ar_image_url: string;
  ar_content_type: string; // 'ar-3d-spatial' | '2d-overlay' | ''
}

interface StepFormProps {
  defaultValues?: StepFormValues;
  onSubmit: (payload: CreateStepPayload) => Promise<unknown>;
  isLoading?: boolean;
  submitLabel?: string;
  huntId?: string;
  stepId?: string;
}

function toPayload(v: StepFormValues): CreateStepPayload {
  const payload: CreateStepPayload = {
    order: parseInt(v.order, 10) || 0,
    title: v.title.trim(),
    validation_radius: parseInt(v.validation_radius, 10) || 50,
  };
  if (v.description.trim()) payload.description = v.description.trim();
  const lat = parseFloat(v.lat);
  const lng = parseFloat(v.lng);
  if (!isNaN(lat)) payload.lat = lat;
  if (!isNaN(lng)) payload.lng = lng;
  if (v.ar_image_url) {
    if (v.ar_content_type === 'ar-3d-spatial') {
      payload.ar_content = {
        type: 'ar-3d-spatial',
        marker_image: v.ar_image_url,
        artwork_image: v.ar_image_url,
      };
    } else {
      payload.ar_content = { type: '2d-overlay', image: v.ar_image_url };
    }
  }
  return payload;
}

export function stepDtoToFormValues(step: StepDto): StepFormValues {
  const ac = step.ar_content as { type?: string; image?: string; marker_image?: string } | null;
  const acType = ac?.type ?? '';
  const arImageUrl =
    acType === 'ar-3d-spatial' ? (ac?.marker_image ?? '') : (ac?.image ?? '');
  return {
    order: String(step.order),
    title: step.title,
    description: step.description ?? '',
    lat: '',
    lng: '',
    validation_radius: String(step.validation_radius),
    ar_image_url: arImageUrl,
    ar_content_type: acType,
  };
}

export default function StepForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Enregistrer',
  huntId,
  stepId,
}: StepFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<StepFormValues>({
    defaultValues: defaultValues ?? {
      order: '0',
      title: '',
      description: '',
      lat: '',
      lng: '',
      validation_radius: '50',
      ar_image_url: '',
      ar_content_type: '',
    },
  });

  const arImageUrl = useWatch({ control, name: 'ar_image_url' });
  const arContentType = useWatch({ control, name: 'ar_content_type' });
  const isArSpatial = arContentType === 'ar-3d-spatial';

  const handleFormSubmit = async (values: StepFormValues) => {
    await onSubmit(toPayload(values));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Ordre */}
        <div className="space-y-1.5">
          <Label htmlFor="order">Ordre</Label>
          <Input
            id="order"
            type="number"
            min={0}
            {...register('order', { required: true, min: 0 })}
          />
        </div>

        {/* Rayon de validation */}
        <div className="space-y-1.5">
          <Label htmlFor="validation_radius">Rayon de validation (m)</Label>
          <Input
            id="validation_radius"
            type="number"
            min={10}
            max={10000}
            {...register('validation_radius', { required: true, min: 10, max: 10000 })}
          />
          {errors.validation_radius && (
            <p className="text-xs text-red-500">Entre 10 et 10 000 m</p>
          )}
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Titre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex : Devant la fontaine"
          {...register('title', { required: true, minLength: 2, maxLength: 200 })}
        />
        {errors.title && (
          <p className="text-xs text-red-500">Le titre est requis (2–200 caractères)</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Indices pour trouver l'étape…"
          {...register('description')}
        />
      </div>

      {/* Coordonnées GPS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            placeholder="48.8566"
            {...register('lat')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            placeholder="2.3522"
            {...register('lng')}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Les coordonnées GPS définissent le point de validation sur la carte.
      </p>

      {/* AR Content */}
      <div className="space-y-1.5">
        <Label>{isArSpatial ? 'Image de référence AR (œuvre à scanner)' : 'Contenu AR (optionnel)'}</Label>
        <p className="text-xs text-gray-400">
          {isArSpatial
            ? 'Photo du tableau / de l\'œuvre physique que l\'app reconnaîtra avec la caméra.'
            : 'Image superposée en réalité augmentée (overlay 2D).'}
        </p>
        <input type="hidden" {...register('ar_content_type')} />
        <FileUpload
          value={arImageUrl || undefined}
          onChange={(url) => setValue('ar_image_url', url ?? '')}
          uploadContext={{ huntId, stepId }}
          accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
          label={isArSpatial ? 'Cliquer ou déposer l\'image de référence' : 'Cliquer ou déposer une image AR'}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
