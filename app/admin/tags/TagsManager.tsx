'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { createTag, deleteTag, updateTag } from '@/lib/actions/tags';
import type { ActionResult } from '@/lib/actions/result';
import type { AdminTagRow } from '@/lib/services/tags';

const ERRORS: Record<string, string> = {
  conflict: 'A tag with that name already exists.',
  stale: 'Someone else changed this tag. The list has been refreshed; try again.',
  not_found: 'That tag was already deleted.',
  forbidden: 'You do not have permission to manage tags.',
};

const messageFor = (result: Extract<ActionResult<unknown>, { ok: false }>) =>
  result.issues?.[0]?.message ?? ERRORS[result.error] ?? 'Something went wrong. Try again.';

/** The tags admin: create, rename (with the loaded `updatedAt`) and delete via Server Actions. */
export function TagsManager({ tags }: { tags: AdminTagRow[] }) {
  const router = useRouter();
  const [newTagName, setNewTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingTag, setEditingTag] = useState<AdminTagRow | null>(null);
  const [editName, setEditName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /** Runs one action; on success (or a stale/not_found answer) re-reads the list. */
  const run = async (action: () => Promise<ActionResult<unknown>>): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) setError(messageFor(result));
      if (result.ok || result.error === 'stale' || result.error === 'not_found') router.refresh();
      return result.ok;
    } catch {
      setError('Something went wrong. Try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    if (await run(() => createTag({ name: newTagName }))) setNewTagName('');
  };

  const handleEditClick = (tag: AdminTagRow) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editName.trim()) return;
    const tag = editingTag;
    const ok = await run(() => updateTag({ id: tag.id, name: editName, updatedAt: tag.updatedAt ?? '' }));
    if (ok) {
      setIsEditDialogOpen(false);
      setEditingTag(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    await run(() => deleteTag(id));
    setDeletingId(null);
  };

  return (
    <div className="container mx-auto py-20">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tags</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Tags</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tag Name</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    value={newTagName} 
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !newTagName.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Tag
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tags List */}
        <div className="md:col-span-2">
          <div className="border rounded-md bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No tags found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditClick(tag)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          <AlertDialog open={deletingId === tag.id} onOpenChange={(open) => {
                            if (!open && submitting) return;
                            setDeletingId(open ? tag.id : null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the tag &quot;{tag.name}&quot; and remove it from all associated shows.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                  }}
                                  disabled={submitting}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  {submitting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tag Name</Label>
              <Input 
                id="edit-name" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                disabled={submitting}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !editName.trim()}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
