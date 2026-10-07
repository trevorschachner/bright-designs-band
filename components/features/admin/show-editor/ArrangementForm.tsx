'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createArrangement, updateArrangement } from '@/lib/actions/arrangements';
import type { EditableArrangement } from '@/lib/services/admin';
import { formatDuration } from '@/lib/utils';
import {
  ARRANGEMENT_ISSUE_FIELD,
  arrangementFormSchema,
  arrangementFormToInput,
  DEFAULT_ARRANGER,
  type ArrangementFormValues,
} from '@/lib/validation/arrangements';
import { applyIssues, ERROR_TEXT } from './action-errors';
import { Field, TagPicker, type TagOption } from './ShowFields';

const FIELDS = Object.keys(arrangementFormSchema.shape);

const SELECT = 'w-full h-10 px-3 border rounded-md bg-background text-sm';

function defaults(arrangement: EditableArrangement | undefined, percussionArranger: string): ArrangementFormValues {
  return {
    title: arrangement?.title ?? '',
    composer: arrangement?.composer ?? '',
    arranger: arrangement ? (arrangement.arranger ?? '') : DEFAULT_ARRANGER,
    percussionArranger: arrangement ? (arrangement.percussionArranger ?? '') : percussionArranger,
    description: arrangement?.description ?? '',
    scene: arrangement?.scene ?? '',
    grade: arrangement?.grade ?? '',
    ensembleSize: arrangement?.ensembleSize ?? '',
    year: arrangement?.year != null ? String(arrangement.year) : '',
    duration: formatDuration(arrangement?.durationSeconds),
    youtubeUrl: arrangement?.youtubeUrl ?? '',
    sampleScoreUrl: arrangement?.sampleScoreUrl ?? '',
    commissioned: arrangement?.commissioned ?? '',
    tags: arrangement?.tagIds ?? [],
  };
}

type Props = {
  showId: number;
  /** Edit this part; absent = add a new one to the end of the show. */
  arrangement?: EditableArrangement;
  /** New parts start with the show's percussion credit, as before. */
  showPercussionArranger?: string | null;
  allTags: TagOption[];
  onSaved: () => void;
  onCancel: () => void;
};

/** One part's fields. `createArrangement` or `updateArrangement` (with the part's `updatedAt`). */
export function ArrangementForm({ showId, arrangement, showPercussionArranger, allTags, onSaved, onCancel }: Props) {
  const { register, handleSubmit, formState, setError, setValue, control } = useForm<ArrangementFormValues>({
    resolver: zodResolver(arrangementFormSchema),
    defaultValues: defaults(arrangement, showPercussionArranger ?? ''),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const { errors, isSubmitting } = formState;
  const tags = useWatch({ control, name: 'tags' });
  const id = (name: string) => `arr-${arrangement?.id ?? 'new'}-${name}`;

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const fields = arrangementFormToInput(values);
    try {
      const result = arrangement
        ? await updateArrangement({ id: arrangement.id, updatedAt: arrangement.updatedAt, ...fields })
        : await createArrangement({ showId, ...fields });
      if (result.ok) return onSaved();
      if (result.error === 'stale') return setStale(true);
      const unplaced = result.error === 'invalid' ? applyIssues(result.issues, FIELDS, setError, ARRANGEMENT_ISSUE_FIELD) : [];
      setMessage(unplaced[0] ?? ERROR_TEXT[result.error]);
    } catch {
      setMessage(ERROR_TEXT.failed);
    }
  });

  const text = (name: keyof ArrangementFormValues, label: string, extra: { placeholder?: string; required?: boolean } = {}) => (
    <Field id={id(name)} label={label} required={extra.required} error={errors[name]?.message}>
      <Input id={id(name)} placeholder={extra.placeholder} aria-invalid={Boolean(errors[name])} {...register(name)} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {stale && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>This part was changed by someone else. Reload to see their changes.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {text('title', 'Title', { required: true })}
        {text('composer', 'Composer')}
        {text('arranger', 'Music Arranger')}
        {text('percussionArranger', 'Percussion Arranger')}
        <Field id={id('scene')} label="Scene" error={errors.scene?.message}>
          <select id={id('scene')} className={SELECT} {...register('scene')}>
            <option value="">Select scene...</option>
            <option value="Opener">Opener</option>
            <option value="Ballad">Ballad</option>
            <option value="Closer">Closer</option>
          </select>
        </Field>
        <Field id={id('grade')} label="Grade" error={errors.grade?.message}>
          <select id={id('grade')} className={SELECT} {...register('grade')}>
            <option value="">Select grade...</option>
            <option value="1_2">Grade 1-2</option>
            <option value="3_4">Grade 3-4</option>
            <option value="5_plus">Grade 5+</option>
          </select>
        </Field>
        <Field id={id('ensembleSize')} label="Ensemble Size" error={errors.ensembleSize?.message}>
          <select id={id('ensembleSize')} className={SELECT} {...register('ensembleSize')}>
            <option value="">Select size...</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </Field>
        {text('year', 'Year')}
        {text('duration', 'Duration (mm:ss)', { placeholder: 'e.g. 4:30' })}
        {text('youtubeUrl', 'YouTube URL')}
        {text('sampleScoreUrl', 'Sample Score URL')}
        {text('commissioned', 'Commissioned')}
        <Field id={id('description')} label="Description" error={errors.description?.message} className="md:col-span-2">
          <Textarea id={id('description')} rows={3} {...register('description')} />
        </Field>
        <div className="md:col-span-2 space-y-2">
          <span className="text-sm font-medium">Tags</span>
          <TagPicker
            idPrefix={id('tag')}
            allTags={allTags}
            selected={tags}
            onChange={(next) => setValue('tags', next, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : arrangement ? 'Save' : 'Add Arrangement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
