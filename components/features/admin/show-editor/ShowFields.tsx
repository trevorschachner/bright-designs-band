'use client';

import type { ReactNode } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ShowFormValues } from '@/lib/validation/show-form';

/** Label + control + error, the one layout every show and part field uses. */
export function Field({
  id,
  label,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export type TagOption = { id: number; name: string };

/** A checkbox per tag, writing the selected ids into `name` (dirtying the form). */
export function TagPicker({
  idPrefix,
  allTags,
  selected,
  onChange,
}: {
  idPrefix: string;
  allTags: TagOption[];
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  if (allTags.length === 0) return <p className="text-sm text-muted-foreground">No tags yet.</p>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded bg-muted/30">
      {allTags.map((tag) => (
        <div key={tag.id} className="flex items-center">
          <input
            type="checkbox"
            id={`${idPrefix}-${tag.id}`}
            checked={selected.includes(tag.id)}
            onChange={() =>
              onChange(selected.includes(tag.id) ? selected.filter((id) => id !== tag.id) : [...selected, tag.id])
            }
            className="mr-2"
          />
          <label htmlFor={`${idPrefix}-${tag.id}`} className="text-sm cursor-pointer">
            {tag.name}
          </label>
        </div>
      ))}
    </div>
  );
}

const CREDITS: { name: keyof ShowFormValues; label: string }[] = [
  { name: 'windArranger', label: 'Winds Arranger' },
  { name: 'percussionArranger', label: 'Percussion Arranger' },
  { name: 'soundDesigner', label: 'Sound Designer' },
  { name: 'drillWriter', label: 'Drill Writer' },
  { name: 'programCoordinator', label: 'Program Coordinator' },
  { name: 'commissioned', label: 'Commissioned' },
];

type FieldsProps = {
  register: UseFormRegister<ShowFormValues>;
  errors: FieldErrors<ShowFormValues>;
};

/** Year, difficulty, duration, display order, description. Both modes. */
export function ShowBasicFields({ register, errors }: FieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field id="year" label="Year" error={errors.year?.message}>
          <Input id="year" inputMode="numeric" placeholder="2024" {...register('year')} />
        </Field>
        <Field id="difficulty" label="Difficulty" error={errors.difficulty?.message}>
          <select id="difficulty" className="w-full h-10 px-3 border rounded-md bg-background text-sm" {...register('difficulty')}>
            <option value="">Select difficulty...</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </Field>
        <Field id="duration" label="Duration" error={errors.duration?.message}>
          <Input id="duration" placeholder="e.g., 8:30" {...register('duration')} />
        </Field>
        <Field id="displayOrder" label="Display Order" error={errors.displayOrder?.message}>
          <Input id="displayOrder" type="number" {...register('displayOrder')} />
        </Field>
      </div>
      <Field id="description" label="Description" error={errors.description?.message}>
        <Textarea id="description" rows={4} {...register('description')} />
      </Field>
    </>
  );
}

/** Media links, featured and credits. Edit mode only (created shows are enriched by editing). */
export function ShowDetailFields({
  register,
  errors,
  featured,
  setValue,
  thumbnailControl,
}: FieldsProps & {
  featured: boolean;
  setValue: UseFormSetValue<ShowFormValues>;
  thumbnailControl: ReactNode;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field id="thumbnailUrl" label="Thumbnail URL" error={errors.thumbnailUrl?.message} className="md:col-span-2">
          <div className="flex gap-2">
            <Input id="thumbnailUrl" {...register('thumbnailUrl')} />
            {thumbnailControl}
          </div>
        </Field>
        <Field id="youtubeUrl" label="YouTube URL" error={errors.youtubeUrl?.message}>
          <Input id="youtubeUrl" {...register('youtubeUrl')} />
        </Field>
        <Field id="videoUrl" label="Video URL" error={errors.videoUrl?.message}>
          <Input id="videoUrl" {...register('videoUrl')} />
        </Field>
        <div className="flex items-center gap-2 pt-2">
          <input
            id="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => setValue('featured', e.target.checked, { shouldDirty: true })}
          />
          <label className="text-sm font-medium" htmlFor="featured">
            Featured
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CREDITS.map(({ name, label }) => (
          <Field key={name} id={name} label={label} error={errors[name]?.message}>
            <Input id={name} {...register(name)} />
          </Field>
        ))}
      </div>
    </>
  );
}
