import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/ui/file-upload';
import type { CreateStepPayload, StepDto } from '@/services/steps.service';

type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo';

export interface StepFormValues {
  order: string;
  title: string;
  description: string;
  lat: string;
  lng: string;
  validation_radius: string;
  validation_type: ValidationType;
  expected_code: string;
  correct_answer: string;
  ar_image_url: string;
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
  if (v.validation_type === 'qrcode' && v.expected_code.trim()) {
    payload.validation_data = { expected_code: v.expected_code.trim() };
  } else if (v.validation_type === 'quiz' && v.correct_answer.trim()) {
    payload.validation_data = { correct_answer: v.correct_answer.trim() };
  } else {
    payload.validation_data = null;
  }
  if (v.ar_image_url) {
    payload.ar_content = { type: '2d-overlay', image: v.ar_image_url };
  }
  return payload;
}

export function stepDtoToFormValues(step: StepDto): StepFormValues {
  const arContent = step.ar_content as { image?: string } | null;
  const vType = (step.validation_type ?? 'gps') as ValidationType;
  const vData = step.validation_data ?? {};
  const location = step as unknown as { location?: { coordinates?: [number, number] } };
  const coords = location?.location?.coordinates;
  return {
    order: String(step.order),
    title: step.title,
    description: step.description ?? '',
    lat: coords ? String(coords[1]) : '',
    lng: coords ? String(coords[0]) : '',
    validation_radius: String(step.validation_radius),
    validation_type: vType,
    expected_code: vType === 'qrcode' ? String(vData.expected_code ?? '') : '',
    correct_answer: vType === 'quiz' ? String(vData.correct_answer ?? '') : '',
    ar_image_url: arContent?.image ?? '',
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
      expected_code: '',
      correct_answer: '',
      ar_image_url: '',
    },
  });

  const validationType = useWatch({ control, name: 'validation_type' });
  const arImageUrl = useWatch({ control, name: 'ar_image_url' });

  const handleFormSubmit = async (values: StepFormValues) => {
    await onSubmit(toPayload(values));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="order">Ordre</Label>
          <Input
            id="order"
            type="number"
            min={0}
            {...register('order', { required: true, min: 0 })}
          />
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
          {errors.validation_radius && (
            <p className="text-xs text-red-500">Entre 10 et 10 000 m</p>
          )}
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Indices pour trouver l'étape…"
          {...register('description')}
        />
      </div>

      {/* Type de validation */}
      <div className="space-y-1.5">
        <Label htmlFor="validation_type">Type de validation</Label>
        <select
          id="validation_type"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('validation_type', { required: true })}
        >
          <option value="gps">GPS — proximité géographique</option>
          <option value="qrcode">QR Code</option>
          <option value="quiz">Quiz — réponse textuelle</option>
          <option value="photo">Photo — validation automatique</option>
        </select>
      </div>

      {/* Champs conditionnels selon le type */}
      {validationType === 'gps' && (
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
      )}

      {validationType === 'qrcode' && (
        <div className="space-y-1.5">
          <Label htmlFor="expected_code">
            Code QR attendu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="expected_code"
            placeholder="Ex : LOOTOPIA-2024"
            {...register('expected_code', { required: validationType === 'qrcode' })}
          />
          {errors.expected_code && (
            <p className="text-xs text-red-500">Le code QR est requis</p>
          )}
        </div>
      )}

      {validationType === 'quiz' && (
        <div className="space-y-1.5">
          <Label htmlFor="correct_answer">
            Bonne réponse <span className="text-red-500">*</span>
          </Label>
          <Input
            id="correct_answer"
            placeholder="Ex : Paris"
            {...register('correct_answer', { required: validationType === 'quiz' })}
          />
          {errors.correct_answer && (
            <p className="text-xs text-red-500">La réponse est requise</p>
          )}
        </div>
      )}

      {/* AR Content */}
      <div className="space-y-1.5">
        <Label>Contenu AR (optionnel)</Label>
        <p className="text-xs text-gray-400">
          Image superposée en réalité augmentée sur la carte (overlay 2D).
        </p>
        <FileUpload
          value={arImageUrl || undefined}
          onChange={(url) => setValue('ar_image_url', url ?? '')}
          accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
          label="Cliquer ou déposer une image AR"
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
