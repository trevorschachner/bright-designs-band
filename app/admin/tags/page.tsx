'use client';

import { useEffect, useState } from 'react';

export default function ManageTagsPage() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTags(data));
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
      <h1 className="text-4xl font-bold text-center">Manage Tags</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
        <div className="mb-4">
          <label className="block mb-2" htmlFor="name">Tag Name</label>
          <input className="w-full p-2 border rounded" type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded">Add Tag</button>
      </form>
      <table className="w-full max-w-md mx-auto mt-8">
        <thead>
          <tr>
            <th className="text-left">Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag: any) => (
            <tr key={tag.id}>
              <td>{tag.name}</td>
              <td>
                {/* <Link href={`/admin/tags/${tag.id}`} className="text-primary hover:underline">Edit</Link> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 