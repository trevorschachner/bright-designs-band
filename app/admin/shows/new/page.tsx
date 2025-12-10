'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function NewShowPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTags(data));
  }, []);

  const handleTagChange = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to safely parse JSON response
  const parseJsonResponse = async (response: Response): Promise<{ data: any; rawText: string }> => {
    const rawText = await response.text();
    if (!rawText) return { data: null, rawText };
    try {
      return { data: JSON.parse(rawText), rawText };
    } catch {
      return { data: null, rawText };
    }
  };

  const uploadThumbnail = async (showId: number): Promise<string | null> => {
    if (!thumbnailFile) return null;

    setIsUploadingThumbnail(true);
    try {
      // 1. Get Signed Upload URL
      const signResponse = await fetch('/api/files/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: thumbnailFile.name,
          fileType: 'image',
          showId: showId,
          isPublic: true,
        }),
      });

      const { data: signResult, rawText: signRaw } = await parseJsonResponse(signResponse);

      if (!signResponse.ok || !signResult) {
         throw new Error(signResult?.error || signRaw || 'Failed to get upload URL');
      }

      const { signedUrl, storagePath } = signResult.data;

      // 2. Upload to Supabase Storage directly
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': thumbnailFile.type,
        },
        body: thumbnailFile,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`Storage upload failed: ${uploadResponse.statusText} ${errText}`);
      }

      // 3. Record Metadata in DB
      const recordResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storagePath,
          fileName: thumbnailFile.name,
          fileType: 'image',
          fileSize: thumbnailFile.size,
          mimeType: thumbnailFile.type,
          showId: showId,
          isPublic: true,
          description: 'Show thumbnail',
          displayOrder: 0,
        }),
      });

      const { data: recordResult, rawText: recordRaw } = await parseJsonResponse(recordResponse);

      if (!recordResponse.ok) {
         throw new Error(recordResult?.error || recordRaw || 'Failed to record file upload');
      }

      return recordResult?.data?.url || null;

    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      // Propagate error so we know it failed, but don't stop the whole flow if show was created
      throw error;
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const payload: any = {
        title,
        difficulty,
        duration,
        displayOrder: parseInt(displayOrder) || 0,
        description,
        tags: selectedTags,
      };

      // Add year if provided
      if (year) {
        const yearNum = parseInt(year, 10);
        if (!isNaN(yearNum)) {
          payload.year = yearNum;
        }
      }

      // First create the show
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create show');
      }

      const createdShowId = result.id;

      // Then upload thumbnail if provided
      if (thumbnailFile && createdShowId) {
        try {
          const uploadedUrl = await uploadThumbnail(createdShowId);
          
          if (uploadedUrl) {
            // Update the show with the thumbnail URL
            // IMPORTANT: We must include tags again, otherwise the PUT endpoint might wipe them
            await fetch(`/api/shows/${createdShowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                thumbnailUrl: uploadedUrl,
                tags: selectedTags 
              }),
            });
          }
        } catch (thumbnailError) {
          console.warn('Show created but thumbnail upload failed:', thumbnailError);
          // Optional: Set a warning message, but still consider success since show exists
          setSubmitError('Show created, but thumbnail upload failed. You can retry uploading it on the edit page.');
        }
      }

      setSubmitSuccess(true);
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/admin/shows');
      }, 1500);
    } catch (error) {
      console.error('Error creating show:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create show');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-20 space-y-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/shows">Shows</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add New Show</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-4xl font-bold text-center">Add New Show</h1>

      {submitSuccess && (
        <Alert className="max-w-2xl mx-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Show created successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {submitError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Show Details</CardTitle>
            <CardDescription>Enter the basic information for the show</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter show title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 8:30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter show description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer font-normal">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Show Thumbnail</CardTitle>
            <CardDescription>Upload a thumbnail image for this show</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </div>
            {thumbnailPreview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/shows')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Add Show'}
          </Button>
        </div>
      </form>
    </div>
  );
}
