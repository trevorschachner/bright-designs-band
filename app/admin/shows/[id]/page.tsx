'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileUpload } from '@/components/features/file-upload';
import { FileGallery } from '@/components/features/file-gallery';
import { YouTubeUpload } from '@/components/features/youtube-upload';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditShowPage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [filesVersion, setFilesVersion] = useState<number>(0);

  useEffect(() => {
    params.then(resolvedParams => {
      setId(resolvedParams.id);
    });
  }, [params]);
  const [show, setShow] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [newArrangement, setNewArrangement] = useState({ title: '', type: '', price: '', displayOrder: '' });

  useEffect(() => {
    if (id) {
      fetch(`/api/shows/${id}`)
        .then(res => res.json())
        .then(data => {
          setShow(data);
          setSelectedTags(data.showsToTags.map((st: any) => st.tagId));
          setArrangements(data.arrangements);
        });
      fetch('/api/tags')
        .then(res => res.json())
        .then(data => setTags(data));
    }
  }, [id]);

  const handleTagChange = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleArrangementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/arrangements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newArrangement, displayOrder: newArrangement.displayOrder ? Number(newArrangement.displayOrder) : undefined, showId: id }),
    });
    if (response.ok) {
      setNewArrangement({ title: '', type: '', price: '', displayOrder: '' });
      fetch(`/api/shows/${id}`)
        .then(res => res.json())
        .then(data => setArrangements(data.arrangements));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(`/api/shows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...show, tags: selectedTags }),
    });
    if (response.ok) {
      router.push('/admin/shows');
    }
  };

  if (!show) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center">Edit Show</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
        <div className="mb-4">
          <label className="block mb-2" htmlFor="title">Title</label>
          <input className="w-full p-2 border rounded" type="text" id="title" value={show.title} onChange={(e) => setShow({ ...show, title: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="year">Year</label>
          <input className="w-full p-2 border rounded" type="text" id="year" value={show.year} onChange={(e) => setShow({ ...show, year: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="difficulty">Difficulty</label>
          <select className="w-full p-2 border rounded" id="difficulty" value={show.difficulty} onChange={(e) => setShow({ ...show, difficulty: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="duration">Duration</label>
          <input className="w-full p-2 border rounded" type="text" id="duration" value={show.duration} onChange={(e) => setShow({ ...show, duration: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="description">Description</label>
          <textarea className="w-full p-2 border rounded" id="description" value={show.description} onChange={(e) => setShow({ ...show, description: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="price">Price</label>
          <input className="w-full p-2 border rounded" type="text" id="price" value={show.price} onChange={(e) => setShow({ ...show, price: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="thumbnailUrl">Thumbnail URL</label>
          <input className="w-full p-2 border rounded" type="text" id="thumbnailUrl" value={show.thumbnailUrl} onChange={(e) => setShow({ ...show, thumbnailUrl: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Tags</label>
          <div className="grid grid-cols-3 gap-2">
            {tags.map(tag => (
              <div key={tag.id}>
                <input
                  type="checkbox"
                  id={`tag-${tag.id}`}
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                />
                <label htmlFor={`tag-${tag.id}`} className="ml-2">{tag.name}</label>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">Save Changes</button>
      </form>

      <div className="max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Arrangements</h2>
        <form onSubmit={handleArrangementSubmit}>
          <div className="mb-4">
            <label className="block mb-2" htmlFor="arrangementTitle">Title</label>
            <input className="w-full p-2 border rounded" type="text" id="arrangementTitle" value={newArrangement.title} onChange={(e) => setNewArrangement({ ...newArrangement, title: e.target.value })} />
          </div>
          <div className="mb-4">
            <label className="block mb-2" htmlFor="arrangementType">Type</label>
            <input className="w-full p-2 border rounded" type="text" id="arrangementType" value={newArrangement.type} onChange={(e) => setNewArrangement({ ...newArrangement, type: e.target.value })} />
          </div>
          <div className="mb-4">
            <label className="block mb-2" htmlFor="arrangementPrice">Price</label>
            <input className="w-full p-2 border rounded" type="text" id="arrangementPrice" value={newArrangement.price} onChange={(e) => setNewArrangement({ ...newArrangement, price: e.target.value })} />
          </div>
          <div className="mb-4">
            <label className="block mb-2" htmlFor="arrangementOrder">Order in Show</label>
            <input className="w-full p-2 border rounded" type="number" id="arrangementOrder" value={newArrangement.displayOrder} onChange={(e) => setNewArrangement({ ...newArrangement, displayOrder: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">Add Arrangement</button>
        </form>
        <table className="w-full mt-4">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Price</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {arrangements.map(arrangement => (
              <tr key={arrangement.id}>
                <td>{arrangement.title}</td>
                <td>{arrangement.type}</td>
                <td>{arrangement.price}</td>
                <td>{arrangement.displayOrder}</td>
                <td>
                  <button className="text-red-500 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Files section */}
      <div className="max-w-3xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-4">Files</h2>
        <div className="grid grid-cols-1 gap-8">
          {/* Upload files for this show */}
          <FileUpload 
            showId={id ? Number(id) : undefined}
            onUploadSuccess={() => setFilesVersion(v => v + 1)}
            onUploadError={(err) => console.error('Upload error:', err)}
          />

        {/* Add YouTube link for this show */}
          <YouTubeUpload 
            showId={id ? Number(id) : undefined}
            onUploadSuccess={() => setFilesVersion(v => v + 1)}
            onUploadError={(err) => console.error('YouTube upload error:', err)}
          />

          {/* Gallery of all files for this show */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Gallery</h3>
            <FileGallery 
              key={filesVersion}
              showId={id ? Number(id) : undefined}
              editable
              onFileDelete={() => setFilesVersion(v => v + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 