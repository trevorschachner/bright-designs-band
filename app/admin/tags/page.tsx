'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function ManageTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingTag, setEditingTag] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTags = () => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        setTags(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tags', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });
      
      if (response.ok) {
        setNewTagName('');
        fetchTags();
      }
    } catch (err) {
      console.error('Failed to create tag', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (tag: any) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingTag(null);
        fetchTags();
      }
    } catch (err) {
      console.error('Failed to update tag', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tags/${deletingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeletingId(null);
        fetchTags();
      }
    } catch (err) {
      console.error('Failed to delete tag', err);
    } finally {
      setSubmitting(false);
    }
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
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No tags found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag: any) => (
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
