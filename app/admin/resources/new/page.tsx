'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createResource } from '@/lib/actions/resources';
import { resourceErrorMessage } from '../resource-errors';
import { resourceFileType, uploadFileDirect } from '@/lib/uploads/direct-upload';

export default function NewResourcePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    imageUrl: '', // Optional
    isActive: true,
    requiresContactForm: true,
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    try {
      // Resource attachments are public and belong to no show (stored under resources/).
      const uploaded = await uploadFileDirect({ file, fileType: resourceFileType(file), isPublic: true, description: 'Resource File' });
      setFormData(prev => ({ ...prev, fileUrl: uploaded.url }));
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error && err.message ? err.message : 'Failed to upload file');
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
      const uploaded = await uploadFileDirect({ file, fileType: 'image', isPublic: true, description: 'Resource Image' });
      setFormData(prev => ({ ...prev, imageUrl: uploaded.url }));
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error && err.message ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await createResource(formData);
      if (!result.ok) throw new Error(resourceErrorMessage(result));

      router.push('/admin/resources');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/admin/resources">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Resource</h1>
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
                placeholder="e.g. Visual Technique Guide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the resource..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Resource File</Label>
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
                <p className="text-xs text-green-600 mt-1">
                  File uploaded successfully: {formData.fileUrl.split('/').pop()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Resource Image (Optional)</Label>
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
                <p className="text-xs text-green-600 mt-1">
                  Image uploaded successfully: {formData.imageUrl.split('/').pop()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL (Manual Override)</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://..."
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
                  Creating...
                </>
              ) : (
                'Create Resource'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

