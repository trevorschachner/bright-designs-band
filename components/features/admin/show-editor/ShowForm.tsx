'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createShow, updateShow } from '@/lib/actions/shows';
import { setShowThumbnail } from '@/lib/actions/files';
import type { EditableShow } from '@/lib/services/admin';
import { uploadFileDirect } from '@/lib/uploads/direct-upload';
import {
  showFormDefaults,
  showFormSchema,
  showFormToCreate,
  showFormToUpdate,
  type ShowFormValues,
} from '@/lib/validation/show-form';
import { applyIssues, ERROR_TEXT } from './action-errors';
import { Field, ShowBasicFields, ShowDetailFields, TagPicker, type TagOption } from './ShowFields';

const FIELDS = Object.keys(showFormSchema.shape);

type Props = {
  mode: 'create' | 'edit';
  show?: EditableShow;
  allTags: TagOption[];
  /** The show's current `updated_at` (edit mode), sent with each save. */
  updatedAt?: string;
  /** A thumbnail set elsewhere (the files panel); synced into the field. */
  thumbnailUrl?: string | null;
  /** A save or thumbnail change returned a new `updated_at`. */
  onStamp?: (updatedAt: string, thumbnailUrl?: string | null) => void;
};

/**
 * The show's own fields. Explicit Save (no auto-save), a dirty indicator and
 * a `beforeunload` guard. Saves go through `updateShow` with the loaded
 * `updatedAt`; `stale` means someone else saved first. In create mode it
 * calls `createShow`, uploads the picked thumbnail to the new show, then
 * opens the editor.
 */
export function ShowForm({ mode, show, allTags, updatedAt, thumbnailUrl, onStamp }: Props) {
  const router = useRouter();
  const form = useForm<ShowFormValues>({
    resolver: zodResolver(showFormSchema),
    defaultValues: showFormDefaults(show),
  });
  const { register, handleSubmit, formState, control, setValue, setError, reset, resetField } = form;
  const [editSlug, setEditSlug] = useState(false);
  const [stale, setStale] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const leaving = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { isDirty, errors } = formState;

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // A thumbnail set from the files panel: adopt it unless the field has unsaved edits.
  useEffect(() => {
    if (thumbnailUrl === undefined || formState.dirtyFields.thumbnailUrl) return;
    resetField('thumbnailUrl', { defaultValue: thumbnailUrl ?? '' });
  }, [thumbnailUrl, resetField, formState.dirtyFields.thumbnailUrl]);

  const [slug, tags, featured] = useWatch({ control, name: ['slug', 'tags', 'featured'] });
  const slugChanged = editSlug && show !== undefined && slug !== show.slug;

  const fail = (error: keyof typeof ERROR_TEXT, issues?: { path: string; message: string }[]) => {
    if (error === 'stale') return setStale(true);
    if (error === 'conflict') {
      setError('slug', { type: 'server', message: 'That URL is already used by another show.' });
      return setMessage(ERROR_TEXT.invalid);
    }
    const unplaced = error === 'invalid' ? applyIssues(issues, FIELDS, setError) : [];
    setMessage(unplaced[0] ?? ERROR_TEXT[error]);
  };

  const create = async (values: ShowFormValues) => {
    const result = await createShow(showFormToCreate(values));
    if (!result.ok) return fail(result.error, result.issues);
    const id = result.data.id;
    let query = '';
    if (thumbnailFile) {
      try {
        const file = await uploadFileDirect({ file: thumbnailFile, fileType: 'image', showId: id, description: 'Show thumbnail' });
        const set = await setShowThumbnail({ showId: id, fileId: file.id });
        if (!set.ok) query = '?thumbnail=failed';
      } catch {
        query = '?thumbnail=failed';
      }
    }
    leaving.current = true;
    router.push(`/admin/shows/${id}${query}`);
  };

  const save = async (values: ShowFormValues) => {
    if (!show || !updatedAt) return;
    const result = await updateShow(showFormToUpdate(values, { id: show.id, updatedAt }, slugChanged));
    if (!result.ok) return fail(result.error, result.issues);
    reset({ ...values, slug: result.data.slug });
    setEditSlug(false);
    setSavedAt(new Date());
    onStamp?.(result.data.updatedAt);
    if (result.data.slug !== show.slug) router.replace(`/admin/shows/${result.data.id}`);
    router.refresh();
  };

  const submit = async (values: ShowFormValues) => {
    setMessage(null);
    setSubmitting(true);
    try {
      await (mode === 'create' ? create(values) : save(values));
    } catch {
      setMessage(ERROR_TEXT.failed);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadThumbnail = async (file: File) => {
    if (!show) return;
    setUploading(true);
    setMessage(null);
    try {
      const uploaded = await uploadFileDirect({ file, fileType: 'image', showId: show.id, description: 'Show thumbnail' });
      const result = await setShowThumbnail({ showId: show.id, fileId: uploaded.id });
      if (!result.ok) return fail(result.error, result.issues);
      onStamp?.(result.data.updatedAt, result.data.thumbnailUrl);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to upload thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const pickThumbnail = (file: File | undefined) => {
    if (!file) return;
    if (mode === 'edit') return void uploadThumbnail(file);
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const thumbnailButton = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Upload thumbnail"
        onChange={(e) => {
          pickThumbnail(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()} title="Upload Thumbnail">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </Button>
    </>
  );

  const busy = submitting || uploading;

  return (
    <form onSubmit={(event) => handleSubmit(submit)(event)} className="space-y-6" noValidate>
      {stale && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{ERROR_TEXT.stale}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                leaving.current = true;
                // The editor's canonical URL: the current one may carry ?thumbnail= or an old slug.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full reload on purpose: drop every form's state and re-read the editor
                window.location.assign(`${window.location.origin}/admin/shows/${show ? show.id : ''}`);
              }}
            >
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{mode === 'create' ? 'Show Details' : 'Edit Show Details'}</CardTitle>
            <SaveStatus saving={submitting} dirty={isDirty} savedAt={savedAt} />
          </div>
          {mode === 'create' && <CardDescription>Enter the basic information for the show</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="title" label="Title" required error={errors.title?.message}>
            <Input id="title" placeholder="Enter show title" aria-invalid={Boolean(errors.title)} {...register('title')} />
          </Field>

          {mode === 'edit' && show && (
            <Field id="slug" label="URL" error={errors.slug?.message}>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">/shows/</span>
                <Input id="slug" readOnly={!editSlug} aria-invalid={Boolean(errors.slug)} {...register('slug')} />
                <Button type="button" variant="outline" onClick={() => setEditSlug((on) => !on)}>
                  {editSlug ? 'Keep URL' : 'Edit URL'}
                </Button>
              </div>
              {slugChanged && (
                <p className="text-sm text-amber-600">
                  The old URL /shows/{show.slug} will redirect to the new one.
                </p>
              )}
            </Field>
          )}

          <ShowBasicFields register={register} errors={errors} />

          {mode === 'edit' && (
            <ShowDetailFields
              register={register}
              errors={errors}
              featured={featured}
              setValue={setValue}
              thumbnailControl={thumbnailButton}
            />
          )}

          <Field id="tags" label="Tags" error={errors.tags?.message}>
            <TagPicker idPrefix="tag" allTags={allTags} selected={tags} onChange={(next) => setValue('tags', next, { shouldDirty: true })} />
          </Field>
        </CardContent>
      </Card>

      {mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Show Thumbnail</CardTitle>
            <CardDescription>Upload a thumbnail image for this show</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {thumbnailButton}
              <span className="text-sm text-muted-foreground">{thumbnailFile?.name ?? 'No image chosen'}</span>
            </div>
            {preview && (
              <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden">
                <Image src={preview} alt="Thumbnail preview" fill className="object-cover" unoptimized />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className={mode === 'edit' && isDirty ? 'fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur py-3' : ''}>
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-4 px-4">
          {mode === 'edit' && isDirty && <span className="mr-auto text-sm text-amber-600">You have unsaved changes</span>}
          <Button type="button" variant="outline" disabled={busy} onClick={() => router.push('/admin/shows')}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || (mode === 'edit' && !isDirty)}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Add Show' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SaveStatus({ saving, dirty, savedAt }: { saving: boolean; dirty: boolean; savedAt: Date | null }) {
  if (saving) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="flex items-center gap-2 text-sm text-amber-600" data-testid="dirty-indicator">
        <AlertCircle className="w-4 h-4" /> Unsaved changes
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="w-4 h-4" /> Saved {savedAt.toLocaleTimeString()}
      </span>
    );
  }
  return null;
}
