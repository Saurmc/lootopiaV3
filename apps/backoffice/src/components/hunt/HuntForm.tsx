import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { CreateHuntPayload, HuntDto } from '@/services/hunts.service';

export interface HuntFormValues {
  title: string;
  description: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard' | '';
  duration: string;
  points: string;
  is_active: boolean;
}

interface HuntFormProps {
  defaultValues?: Partial<HuntFormValues>;
  onSubmit: (payload: CreateHuntPayload) => Promise<unknown>;
  isLoading?: boolean;
  submitLabel?: string;
}

function toPayload(values: HuntFormValues): CreateHuntPayload {
  return {
    title: values.title,
    description: values.description || undefined,
    location: values.location || undefined,
    difficulty: values.difficulty || undefined,
    duration: values.duration ? parseInt(values.duration, 10) : undefined,
    points: values.points ? parseInt(values.points, 10) : undefined,
    is_active: values.is_active,
  };
}

export function huntDtoToFormValues(hunt: HuntDto): HuntFormValues {
  return {
    title: hunt.title,
    description: hunt.description ?? '',
    location: hunt.location ?? '',
    difficulty: hunt.difficulty ?? '',
    duration: hunt.duration?.toString() ?? '',
    points: hunt.points?.toString() ?? '',
    is_active: hunt.is_active,
  };
}

export default function HuntForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Enregistrer',
}: HuntFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HuntFormValues>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      difficulty: '',
      duration: '',
      points: '',
      is_active: false,
      ...defaultValues,
    },
  });

  const difficulty = watch('difficulty');
  const isActive = watch('is_active');

  const handleFormSubmit = async (values: HuntFormValues) => {
    await onSubmit(toPayload(values));
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Titre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex : Mystères du Musée"
          {...register('title', {
            required: 'Le titre est requis.',
            minLength: { value: 3, message: '3 caractères minimum.' },
            maxLength: { value: 200, message: '200 caractères maximum.' },
          })}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décrivez votre chasse au trésor…"
          rows={3}
          {...register('description')}
        />
      </div>

      {/* Localisation */}
      <div className="space-y-1.5">
        <Label htmlFor="location">Localisation</Label>
        <Input
          id="location"
          placeholder="Ex : Paris, Louvre"
          {...register('location')}
        />
      </div>

      {/* Difficulté + Durée */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Difficulté</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setValue('difficulty', v as HuntFormValues['difficulty'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Facile</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="hard">Difficile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duration">Durée (min)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            placeholder="60"
            {...register('duration', {
              min: { value: 1, message: 'Durée invalide.' },
            })}
          />
          {errors.duration && <p className="text-xs text-red-500">{errors.duration.message}</p>}
        </div>
      </div>

      {/* Points */}
      <div className="space-y-1.5">
        <Label htmlFor="points">Points à gagner</Label>
        <Input
          id="points"
          type="number"
          min={0}
          placeholder="100"
          {...register('points', {
            min: { value: 0, message: 'Valeur invalide.' },
          })}
        />
        {errors.points && <p className="text-xs text-red-500">{errors.points.message}</p>}
      </div>

      {/* Statut actif */}
      <div className="flex items-center gap-3">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          {...register('is_active')}
          checked={isActive}
          onChange={(e) => setValue('is_active', e.target.checked)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Publier la chasse (visible par les joueurs)
        </Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enregistrement…' : submitLabel}
      </Button>
    </form>
  );
}
