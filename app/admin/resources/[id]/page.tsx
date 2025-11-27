'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function EditResourcePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    fileUrl: '',
    imageUrl: '',
    isActive: true,
    requiresContactForm: true,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/resources/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setFormData({
              title: data.title || '',
              slug: data.slug || '',
              description: data.description || '',
              fileUrl: data.fileUrl || '',
              imageUrl: data.imageUrl || '',
              isActive: data.isActive,
              requiresContactForm: data.requiresContactForm,
            });
          }
        })
        .catch(err => setError('Failed to load resource'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Dynamically determine fileType for API based on MIME
      const mime = file.type;
      let type = 'other';
      if (mime.startsWith('image/')) type = 'image';
      else if (mime.startsWith('audio/')) type = 'audio';
      else if (mime === 'application/pdf') type = 'pdf';
      
      formData.append('fileType', type);
      formData.append('isPublic', 'true');
      formData.append('description', 'Resource File Update');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, fileUrl: data.data.url }));
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'image');
      formData.append('isPublic', 'true');
      formData.append('description', 'Resource Image Update');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.data.url }));
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update resource');
      }

      router.push('/admin/resources');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      router.push('/admin/resources');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="container mx-auto py-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Button variant="ghost" asChild className="mb-4 pl-0">
            <Link href="/admin/resources">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Resource</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the resource.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Update File</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                  className="cursor-pointer"
                />
                {uploadingFile && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.fileUrl && (
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  Current: {formData.fileUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Update Image (Thumbnail)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  className="cursor-pointer"
                />
                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.imageUrl && (
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  Current: {formData.imageUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL (Manual Override)</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active (Visible to public)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requiresContactForm"
                checked={formData.requiresContactForm}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresContactForm: checked })}
              />
              <Label htmlFor="requiresContactForm">Requires Contact Form (Gated)</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || uploadingFile || uploadingImage}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

