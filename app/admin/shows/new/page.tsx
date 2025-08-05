'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewShowPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, year, difficulty, duration, description, price, thumbnailUrl, tags: selectedTags }),
    });
    if (response.ok) {
      router.push('/admin/shows');
    }
  };

  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center">Add New Show</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
        <div className="mb-4">
          <label className="block mb-2" htmlFor="title">Title</label>
          <input className="w-full p-2 border rounded" type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="year">Year</label>
          <input className="w-full p-2 border rounded" type="text" id="year" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="difficulty">Difficulty</label>
          <select className="w-full p-2 border rounded" id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="duration">Duration</label>
          <input className="w-full p-2 border rounded" type="text" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="description">Description</label>
          <textarea className="w-full p-2 border rounded" id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="price">Price</label>
          <input className="w-full p-2 border rounded" type="text" id="price" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="thumbnailUrl">Thumbnail URL</label>
          <input className="w-full p-2 border rounded" type="text" id="thumbnailUrl" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
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
        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">Add Show</button>
      </form>
    </div>
  );
} 