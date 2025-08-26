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

export default function ManageTagsPage() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        setTags(data);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      setName('');
      fetch('/api/tags')
        .then(res => res.json())
        .then(data => setTags(data));
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
      <h1 className="text-4xl font-bold text-center mb-8">Manage Tags</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Add New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tag Name</Label>
              <Input 
                type="text" 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <Button type="submit" className="w-full">Add Tag</Button>
          </form>
        </CardContent>
      </Card>

      <div className="max-w-md mx-auto mt-8">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                tags.map((tag: any) => (
                  <TableRow key={tag.id}>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled>
                        Edit (Coming Soon)
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 