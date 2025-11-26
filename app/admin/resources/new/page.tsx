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
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'other'); // or detect type
      formData.append('isPublic', 'true');
      formData.append('description', 'Resource File');

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
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create resource');
      }

      router.push('/admin/resources');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.fileUrl && (
                <p className="text-xs text-green-600 mt-1">
                  File uploaded successfully: {formData.fileUrl.split('/').pop()}
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

            <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
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

