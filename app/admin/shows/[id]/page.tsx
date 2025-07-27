'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditShowPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [show, setShow] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/shows/${id}`)
        .then(res => res.json())
        .then(data => setShow(data));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(`/api/shows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(show),
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
        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">Save Changes</button>
      </form>
    </div>
  );
} 