import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/ui/file-upload';
import { filesService } from '@/services/files.service';
import type { CreateStepPayload, StepDto } from '@/services/steps.service';

type ValidationTypeValue = 'gps' | 'qrcode' | 'quiz' | 'photo' | 'ar';
type ArTypeValue = '2d-overlay' | 'ar-3d-spatial';
type ModelTypeValue = 'GLTF' | 'OBJ' | 'VRX';

export interface StepFormValues {
  order: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  validation_radius: string;
  validation_type: ValidationTypeValue;
  ar_type: ArTypeValue;
  ar_image_url: string;
  ar_marker_image_url: string;
  ar_model_url: string;
  ar_model_type: ModelTypeValue;
}

interface StepFormProps {
  defaultValues?: StepFormValues;
  onSubmit: (payload: CreateStepPayload) => Promise<unknown>;
  isLoading?: boolean;
  submitLabel?: string;
}

function toPayload(v: StepFormValues): CreateStepPayload {
  const payload: CreateStepPayload = {
    order: parseInt(v.order, 10) || 0,
    title: v.title.trim(),
    validation_radius: parseInt(v.validation_radius, 10) || 50,
    validation_type: v.validation_type,
  };
  if (v.description.trim()) payload.description = v.description.trim();
  const lat = parseFloat(v.lat);
  const lng = parseFloat(v.lng);
  if (!isNaN(lat)) payload.lat = lat;
  if (!isNaN(lng)) payload.lng = lng;

  if (v.validation_type === 'ar') {
    if (v.ar_type === '2d-overlay' && v.ar_image_url) {
      payload.ar_content = {
        type: '2d-overlay',
        image: filesService.getFileUrl(v.ar_image_url),
      };
    } else if (v.ar_type === 'ar-3d-spatial' && v.ar_marker_image_url) {
      const content: Record<string, unknown> = {
        type: 'ar-3d-spatial',
        marker_image: filesService.getFileUrl(v.ar_marker_image_url),
      };
      if (v.ar_model_url.trim()) {
        content.model_url = v.ar_model_url.trim();
        content.model_type = v.ar_model_type;
      }
      payload.ar_content = content;
    }
  }

  return payload;
}

export function stepDtoToFormValues(step: StepDto): StepFormValues {
  const ar = step.ar_content as Record<string, string> | null;
  let ar_type: ArTypeValue = '2d-overlay';
  let ar_image_url = '';
  let ar_marker_image_url = '';
  let ar_model_url = '';
  let ar_model_type: ModelTypeValue = 'GLTF';

  if (ar?.type === 'ar-3d-spatial') {
    ar_type = 'ar-3d-spatial';
    ar_marker_image_url = ar.marker_image ?? '';
    ar_model_url = ar.model_url ?? '';
    ar_model_type = (ar.model_type as ModelTypeValue) ?? 'GLTF';
  } else if (ar?.type === '2d-overlay') {
    ar_type = '2d-overlay';
    ar_image_url = ar.image ?? '';
  }

  return {
    order: String(step.order),
    title: step.title,
    description: step.description ?? '',
    lat: '',
    lng: '',
    validation_radius: String(step.validation_radius),
    validation_type: (step.validation_type ?? 'gps') as ValidationTypeValue,
    ar_type,
    ar_image_url,
    ar_marker_image_url,
    ar_model_url,
    ar_model_type,
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
      validation_type: 'gps',
      ar_type: '2d-overlay',
      ar_image_url: '',
      ar_marker_image_url: '',
      ar_model_url: '',
      ar_model_type: 'GLTF',
    },
  });

  const validationType = useWatch({ control, name: 'validation_type' });
  const arType = useWatch({ control, name: 'ar_type' });
  const arImageUrl = useWatch({ control, name: 'ar_image_url' });
  const arMarkerImageUrl = useWatch({ control, name: 'ar_marker_image_url' });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(toPayload(v)))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="order">Ordre</Label>
          <Input id="order" type="number" min={0} {...register('order', { required: true, min: 0 })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="validation_radius">Rayon de validation (m)</Label>
          <Input
            id="validation_radius"
            type="number"
            min={10}
            max={10000}
            {...register('validation_radius', { required: true, min: 10, max: 10000 })}
          />
          {errors.validation_radius && <p className="text-xs text-red-500">Entre 10 et 10 000 m</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Titre <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Ex : Devant la fontaine"
          {...register('title', { required: true, minLength: 2, maxLength: 200 })}
        />
        {errors.title && <p className="text-xs text-red-500">Le titre est requis (2–200 caractères)</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} placeholder="Indices pour trouver l'étape…" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" type="number" step="any" placeholder="48.8566" {...register('lat')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" type="number" step="any" placeholder="2.3522" {...register('lng')} />
        </div>
      </div>
      <p className="text-xs text-gray-400">Les coordonnées GPS définissent le point de validation sur la carte.</p>

      {/* Type de validation */}
      <div className="space-y-1.5">
        <Label htmlFor="validation_type">Type de validation</Label>
        <select
          id="validation_type"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          {...register('validation_type')}
        >
          <option value="gps">GPS — se rendre à un endroit</option>
          <option value="ar">AR — réalité augmentée</option>
          <option value="qrcode">QR Code</option>
          <option value="quiz">Quiz</option>
          <option value="photo">Photo</option>
        </select>
      </div>

      {/* Bloc AR */}
      {validationType === 'ar' && (
        <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="ar_type">Mode AR</Label>
            <select
              id="ar_type"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('ar_type')}
            >
              <option value="ar-3d-spatial">Scanner une œuvre — la caméra doit reconnaître l'image</option>
              <option value="2d-overlay">Overlay direct — superpose une image sans scan (indice visuel)</option>
            </select>
          </div>

          {arType === 'ar-3d-spatial' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Image marqueur <span className="text-red-500">*</span></Label>
                <p className="text-xs text-gray-500">
                  Photo de l'œuvre à scanner. ARKit reconnaîtra cette image depuis la caméra.
                </p>
                <FileUpload
                  value={arMarkerImageUrl || undefined}
                  onChange={(url) => setValue('ar_marker_image_url', url ?? '')}
                  accept={['image/jpeg', 'image/png', 'image/webp']}
                  label="Cliquer ou déposer la photo de l'œuvre"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ar_model_url">URL modèle 3D (optionnel)</Label>
                <p className="text-xs text-gray-500">
                  URL d'un fichier GLB/OBJ hébergé sur MinIO. Si absent, l'image marqueur flotte en AR.
                  Exemple : <code className="text-xs">http://192.168.x.x:9000/lootopia/ar/modele.glb</code>
                </p>
                <Input
                  id="ar_model_url"
                  placeholder="http://192.168.1.14:9000/lootopia/ar/modele.glb"
                  {...register('ar_model_url')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ar_model_type">Format du modèle</Label>
                <select
                  id="ar_model_type"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('ar_model_type')}
                >
                  <option value="GLTF">GLTF / GLB</option>
                  <option value="OBJ">OBJ</option>
                  <option value="VRX">VRX</option>
                </select>
              </div>
            </div>
          )}

          {arType === '2d-overlay' && (
            <div className="space-y-1.5">
              <Label>Image overlay</Label>
              <p className="text-xs text-gray-500">Superposée directement sur la caméra sans scan.</p>
              <FileUpload
                value={arImageUrl || undefined}
                onChange={(url) => setValue('ar_image_url', url ?? '')}
                accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                label="Cliquer ou déposer l'image AR"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
