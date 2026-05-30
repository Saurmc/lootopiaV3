import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/ui/file-upload';
import type { CreateStepPayload, StepDto } from '@/services/steps.service';
import type { ARContent } from '@lootopia/shared';
import { filesService } from '@/services/files.service';

export interface StepFormValues {
  order: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  validation_radius: string;
  ar_image_url: string;
  ar_type: '2d-overlay' | '3d-model';
  ar_pos_x: string;
  ar_pos_y: string;
  ar_pos_z: string;
  ar_scale: string;
}

interface StepFormProps {
  defaultValues?: StepFormValues;
  onSubmit: (payload: CreateStepPayload) => Promise<unknown>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function toPayload(v: StepFormValues): CreateStepPayload {
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
    const arContent: ARContent = {
      type: v.ar_type,
      position: {
        x: parseFloat(v.ar_pos_x) || 0,
        y: parseFloat(v.ar_pos_y) || 0,
        z: parseFloat(v.ar_pos_z) || 0,
      },
      scale: parseFloat(v.ar_scale) || 1,
    };
    if (v.ar_type === '2d-overlay') {
      arContent.image = v.ar_image_url;
    } else {
      arContent.model_url = v.ar_image_url;
    }
    payload.ar_content = arContent;
  }
  return payload;
}

export function stepDtoToFormValues(step: StepDto): StepFormValues {
  const ar = step.ar_content as ARContent | null;
  return {
    order: String(step.order),
    title: step.title,
    description: step.description ?? '',
    lat: '',
    lng: '',
    validation_radius: String(step.validation_radius),
    ar_image_url: ar?.image ?? ar?.model_url ?? '',
    ar_type: ar?.type ?? '2d-overlay',
    ar_pos_x: String(ar?.position?.x ?? 0),
    ar_pos_y: String(ar?.position?.y ?? 0),
    ar_pos_z: String(ar?.position?.z ?? 0),
    ar_scale: String(ar?.scale ?? 1),
  };
}

export default function StepForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Enregistrer',
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
      ar_type: '2d-overlay',
      ar_pos_x: '0',
      ar_pos_y: '0',
      ar_pos_z: '0',
      ar_scale: '1',
    },
  });

  const arImageUrl = useWatch({ control, name: 'ar_image_url' });
  const arType = useWatch({ control, name: 'ar_type' });
  const arPosX = useWatch({ control, name: 'ar_pos_x' });
  const arPosY = useWatch({ control, name: 'ar_pos_y' });
  const arPosZ = useWatch({ control, name: 'ar_pos_z' });
  const arScale = useWatch({ control, name: 'ar_scale' });

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
        <Label>Contenu AR (optionnel)</Label>
        <p className="text-xs text-gray-400">
          Image ou modèle superposé en réalité augmentée.
        </p>
        <FileUpload
          value={arImageUrl || undefined}
          onChange={(url) => setValue('ar_image_url', url ?? '')}
          accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
          label="Cliquer ou déposer une image AR"
        />

        {arImageUrl && (
          <div className="space-y-3 rounded-md border border-gray-200 p-3">
            {/* Type selector */}
            <div className="space-y-1.5">
              <Label htmlFor="ar_type">Type</Label>
              <select
                id="ar_type"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                {...register('ar_type')}
              >
                <option value="2d-overlay">2D Overlay</option>
                <option value="3d-model">3D Model</option>
              </select>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <Label>Position (x / y / z)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="ar_pos_x"
                  type="number"
                  step="0.1"
                  placeholder="x"
                  {...register('ar_pos_x')}
                />
                <Input
                  id="ar_pos_y"
                  type="number"
                  step="0.1"
                  placeholder="y"
                  {...register('ar_pos_y')}
                />
                <Input
                  id="ar_pos_z"
                  type="number"
                  step="0.1"
                  placeholder="z"
                  {...register('ar_pos_z')}
                />
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <Label htmlFor="ar_scale">Échelle</Label>
              <Input
                id="ar_scale"
                type="number"
                min="0.1"
                step="0.1"
                {...register('ar_scale')}
              />
            </div>

            {/* Preview (2d-overlay only) */}
            {arType === '2d-overlay' && (
              <div className="space-y-1.5">
                <Label>Aperçu simulé</Label>
                {/* AR viewport — grille représentant l'espace AR */}
                <div
                  className="relative h-44 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  {/* Croix centrale = origine AR */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-px w-6 bg-gray-300" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-px bg-gray-300" />
                  </div>

                  {/* Image positionnée et mise à l'échelle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={filesService.getFileUrl(arImageUrl)}
                      alt="AR preview"
                      className="max-h-28 max-w-[60%] object-contain"
                      style={{
                        transform: `translate(${(parseFloat(arPosX) || 0) * 24}px, ${-(parseFloat(arPosY) || 0) * 24}px) scale(${Math.max(0.1, parseFloat(arScale) || 1)})`,
                        transition: 'transform 120ms ease',
                      }}
                    />
                  </div>

                  {/* Badges valeurs */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-black/55 px-2 py-1">
                    <span className="text-[10px] text-white/80">pos</span>
                    <span className="rounded bg-white/20 px-1 text-[10px] font-mono text-white">
                      x={arPosX || '0'} y={arPosY || '0'} z={arPosZ || '0'}
                    </span>
                    <span className="ml-auto rounded bg-white/20 px-1 text-[10px] font-mono text-white">
                      ×{arScale || '1'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  x/y déplacent l'image (1 unité = 24 px). z non représenté (profondeur AR).
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
