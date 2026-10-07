'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Turnstile, type TurnstileHandle } from '@/components/forms/turnstile';

interface GuideDownloadDialogProps {
  resourceId: number;
  resourceTitle: string;
}

export function GuideDownloadDialog({ resourceId, resourceTitle }: GuideDownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    role: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'resource_download',
          resourceId,
          resourceTitle,
          turnstileToken: turnstileToken ?? '',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      setIsSuccess(true);

      // Close dialog after the confirmation has been visible for a moment
      setTimeout(() => {
        setOpen(false);
        // Reset state after closing
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({ name: '', email: '', school: '', role: '' });
        }, 500);
      }, 3000);

    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      // Tokens are single-use; get a fresh one for any retry.
      turnstileRef.current?.reset();
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download {resourceTitle}</DialogTitle>
          <DialogDescription>
            Please fill out this quick form and our team will send you this resource.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">You&apos;re all set!</h3>
              <p className="text-sm text-muted-foreground">Thanks! Our team will send the guide to your email.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School / Organization</Label>
              <Input
                id="school"
                required
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="High School Band"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Director, Staff, etc."
              />
            </div>

            <Turnstile ref={turnstileRef} onToken={setTurnstileToken} />

            <Button type="submit" className="w-full" disabled={isLoading || turnstileToken === null}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Guide'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
