'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileUpload } from '@/components/features/file-upload';
import { FileGallery } from '@/components/features/file-gallery';
import { YouTubeUpload } from '@/components/features/youtube-upload';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EditShowPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [filesVersion, setFilesVersion] = useState<number>(0);

  const [show, setShow] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [showAddArrangementForm, setShowAddArrangementForm] = useState(false);
  const [newArrangement, setNewArrangement] = useState({
    title: '',
    type: '',
    composer: '',
    arranger: '',
    percussionArranger: '',
    description: '',
    grade: '',
    year: '',
    durationSeconds: '',
    scene: '',
    ensembleSize: '',
    youtubeUrl: '',
    commissioned: '',
    sampleScoreUrl: '',
    copyrightAmountUsd: '',
    displayOrder: ''
  });
  const [editingArrangement, setEditingArrangement] = useState<number | null>(null);
  const [editingArrangementData, setEditingArrangementData] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [savingArrangement, setSavingArrangement] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/shows/${id}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const text = await res.text();
          if (!text) return null;
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })
        .then((data) => {
          if (!data) return;
          // Ensure edit state contains keys for all editable fields
          setShow({
            // core/legacy
            id: data.id,
            name: data.name ?? data.title ?? '',
            title: data.title ?? data.name ?? '',
            description: data.description ?? '',
            year: data.year ?? '',
            difficulty: data.difficulty ?? '',
            duration: data.duration ?? '',
            thumbnailUrl: data.thumbnailUrl ?? '',
            featured: !!(data.featured ?? data.featured === true),
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : (typeof data.display_order === 'number' ? data.display_order : 0),
            // extended
            youtubeUrl: data.youtubeUrl ?? '',
            commissioned: data.commissioned ?? '',
            programCoordinator: data.programCoordinator ?? '',
            percussionArranger: data.percussionArranger ?? '',
            soundDesigner: data.soundDesigner ?? '',
            windArranger: data.windArranger ?? '',
            drillWriter: data.drillWriter ?? '',
          });
          const tagIds = Array.isArray(data.showsToTags)
            ? data.showsToTags
                .map((st: any) => st?.tagId ?? st?.tag?.id)
                .filter((v: any) => typeof v === 'number')
            : [];
          setSelectedTags(tagIds);
          setArrangements(Array.isArray(data.arrangements) ? data.arrangements : []);
        })
        .catch((err) => {
          console.error('Failed to load show data:', err);
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

  // Normalize and coerce payload before saving to DB
  const buildPayload = () => {
    const normalizeNumber = (v: any) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const normalizeString = (v: any) => (v === undefined || v === null ? '' : String(v));
    const normalizeNullableString = (v: any) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };

    const payload: any = {
      // keep both for compatibility; downstream can rely on `name` primarily
      name: normalizeString(show.name ?? show.title),
      title: normalizeString(show.title ?? show.name),
      description: normalizeNullableString(show.description),
      difficulty: normalizeString(show.difficulty || ''),
      duration: normalizeNullableString(show.duration),
      year: normalizeNumber(show.year),
      thumbnailUrl: normalizeNullableString(show.thumbnailUrl),
      featured: !!show.featured,
      displayOrder: normalizeNumber(show.displayOrder) ?? 0,
      // extended fields
      youtubeUrl: normalizeNullableString(show.youtubeUrl),
      commissioned: normalizeNullableString(show.commissioned),
      programCoordinator: normalizeNullableString(show.programCoordinator),
      percussionArranger: normalizeNullableString(show.percussionArranger),
      soundDesigner: normalizeNullableString(show.soundDesigner),
      windArranger: normalizeNullableString(show.windArranger),
      drillWriter: normalizeNullableString(show.drillWriter),
      // tags handled separately below
    };

    return payload;
  };

  const handleArrangementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArrangement.title.trim()) {
      setSaveError('Title is required');
      return;
    }
    
    setSaving(true);
    setSaveError(null);
    
    try {
      // Convert form data to API format
      const payload: any = {
        title: newArrangement.title,
        type: newArrangement.type || null,
        composer: newArrangement.composer || null,
        arranger: newArrangement.arranger || null,
        percussionArranger: newArrangement.percussionArranger || null,
        description: newArrangement.description || null,
        grade: newArrangement.grade || null,
        year: newArrangement.year ? Number(newArrangement.year) : null,
        durationSeconds: newArrangement.durationSeconds ? Number(newArrangement.durationSeconds) : null,
        scene: newArrangement.scene || null,
        ensembleSize: newArrangement.ensembleSize || null,
        youtubeUrl: newArrangement.youtubeUrl || null,
        commissioned: newArrangement.commissioned || null,
        sampleScoreUrl: newArrangement.sampleScoreUrl || null,
        copyrightAmountUsd: newArrangement.copyrightAmountUsd ? Number(newArrangement.copyrightAmountUsd) : null,
        displayOrder: newArrangement.displayOrder ? Number(newArrangement.displayOrder) : undefined,
        showId: id ? Number(id) : undefined,
      };

    const response = await fetch('/api/arrangements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        // Reset form
        setNewArrangement({
          title: '',
          type: '',
          composer: '',
          arranger: '',
          percussionArranger: '',
          description: '',
          grade: '',
          year: '',
          durationSeconds: '',
          scene: '',
          ensembleSize: '',
          youtubeUrl: '',
          commissioned: '',
          sampleScoreUrl: '',
          copyrightAmountUsd: '',
          displayOrder: ''
        });
        setShowAddArrangementForm(false);
        // Reload arrangements
        fetch(`/api/shows/${id}`)
          .then(res => res.json())
          .then(data => setArrangements(data.arrangements));
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Failed to add arrangement');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to add arrangement');
    } finally {
      setSaving(false);
    }
  };

  const handleEditArrangement = (arrangement: any) => {
    setEditingArrangement(arrangement.id);
    setEditingArrangementData({
      title: arrangement.title || '',
      type: arrangement.type || '',
      composer: arrangement.composer || '',
      arranger: arrangement.arranger || '',
      percussionArranger: arrangement.percussionArranger || arrangement.percussion_arranger || '',
      description: arrangement.description || '',
      grade: arrangement.grade || '',
      year: arrangement.year || '',
      durationSeconds: arrangement.durationSeconds || arrangement.duration_seconds || '',
      scene: arrangement.scene || '',
      ensembleSize: arrangement.ensembleSize || arrangement.ensemble_size || '',
      youtubeUrl: arrangement.youtubeUrl || arrangement.youtube_url || '',
      commissioned: arrangement.commissioned || '',
      sampleScoreUrl: arrangement.sampleScoreUrl || arrangement.sample_score_url || '',
      copyrightAmountUsd: arrangement.copyrightAmountUsd || arrangement.copyright_amount_usd || '',
      displayOrder: arrangement.displayOrder || arrangement.display_order || 0,
    });
  };

  const handleSaveArrangement = async (arrangementId: number) => {
    setSavingArrangement(arrangementId);
    setSaveError(null);
    try {
      // Convert camelCase to snake_case for Supabase
      const payload: any = {
        title: editingArrangementData.title || null,
        type: editingArrangementData.type || null,
        composer: editingArrangementData.composer || null,
        arranger: editingArrangementData.arranger || null,
        percussion_arranger: editingArrangementData.percussionArranger || null,
        description: editingArrangementData.description || null,
        grade: editingArrangementData.grade || null,
        year: editingArrangementData.year ? Number(editingArrangementData.year) : null,
        duration_seconds: editingArrangementData.durationSeconds ? Number(editingArrangementData.durationSeconds) : null,
        scene: editingArrangementData.scene || null,
        ensemble_size: editingArrangementData.ensembleSize || null,
        youtube_url: editingArrangementData.youtubeUrl || null,
        commissioned: editingArrangementData.commissioned || null,
        sample_score_url: editingArrangementData.sampleScoreUrl || null,
        copyright_amount_usd: editingArrangementData.copyrightAmountUsd ? Number(editingArrangementData.copyrightAmountUsd) : null,
        display_order: editingArrangementData.displayOrder ? Number(editingArrangementData.displayOrder) : 0,
      };

      const response = await fetch(`/api/arrangements/${arrangementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

    if (response.ok) {
        setEditingArrangement(null);
        setEditingArrangementData(null);
        // Reload arrangements
      fetch(`/api/shows/${id}`)
        .then(res => res.json())
        .then(data => setArrangements(data.arrangements));
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Failed to save arrangement');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save arrangement');
    } finally {
      setSavingArrangement(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      console.log('Saving payload:', { ...payload, tags: selectedTags });
      const response = await fetch(`/api/shows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, tags: selectedTags }),
      });
      
      const responseData = await response.json();
      console.log('Save response:', response.status, responseData);
      
      if (response.ok) {
        router.push('/admin/shows');
      } else {
        const errorMessage = responseData?.error || responseData?.details || 'Failed to save changes.';
        setSaveError(errorMessage);
        console.error('Save failed:', errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Unexpected error saving changes.';
      setSaveError(errorMessage);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!show) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Show</h1>
            <p className="text-muted-foreground">Update show details and manage arrangements</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/shows')}
          >
            ← Back to Shows
          </Button>
        </div>
      </div>
      
      {saveError && !showAddArrangementForm && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {saveError}
        </div>
      )}
      
      {/* Show Information Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Show Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                <div className="text-base">{show.name || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Year</div>
                <div className="text-base">{show.year || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Difficulty</div>
                <div className="text-base">
                  {show.difficulty ? (
                    <Badge variant="outline">{show.difficulty}</Badge>
                  ) : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
                <div className="text-base">{show.duration || '—'}</div>
              </div>
              {show.description && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                  <div className="text-base">{show.description}</div>
                </div>
              )}
              {show.thumbnailUrl && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Thumbnail URL</div>
                  <div className="text-base break-all text-sm">{show.thumbnailUrl}</div>
                </div>
              )}
              {show.youtubeUrl && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">YouTube URL</div>
                  <div className="text-base break-all text-sm">{show.youtubeUrl}</div>
                </div>
              )}
              {show.commissioned && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Commissioned</div>
                  <div className="text-base">{show.commissioned}</div>
                </div>
              )}
              {show.programCoordinator && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Program Coordinator</div>
                  <div className="text-base">{show.programCoordinator}</div>
                </div>
              )}
              {show.percussionArranger && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Percussion Arranger</div>
                  <div className="text-base">{show.percussionArranger}</div>
                </div>
              )}
              {show.soundDesigner && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Sound Designer</div>
                  <div className="text-base">{show.soundDesigner}</div>
                </div>
              )}
              {show.windArranger && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Wind Arranger</div>
                  <div className="text-base">{show.windArranger}</div>
                </div>
              )}
              {show.drillWriter && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Drill Writer</div>
                  <div className="text-base">{show.drillWriter}</div>
                </div>
              )}
              {selectedTags.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(tag => selectedTags.includes(tag.id)).map(tag => (
                      <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {arrangements.length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Arrangements</div>
                  <div className="text-base">{arrangements.length} arrangement{arrangements.length !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Show Form */}
      <Card className="max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Edit Show Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Primary naming */}
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="name">
                Name <span className="text-destructive">*</span>
              </label>
              <input 
                className={`w-full p-2 border rounded ${!show.name ? 'border-destructive' : ''}`} 
                type="text" 
                id="name" 
                value={show.name} 
                onChange={(e) => setShow({ ...show, name: e.target.value, title: e.target.value })} 
                required
              />
              {!show.name && (
                <p className="text-sm text-destructive mt-1">Name is required</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="year">Year</label>
                <input className="w-full p-2 border rounded" type="text" id="year" value={show.year} onChange={(e) => setShow({ ...show, year: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="difficulty">Difficulty</label>
                <select 
                  className="w-full p-2 border rounded" 
                  id="difficulty" 
                  value={show.difficulty} 
                  onChange={(e) => setShow({ ...show, difficulty: e.target.value })}
                >
                  <option value="">Select difficulty...</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="duration">Duration</label>
                <input className="w-full p-2 border rounded" type="text" id="duration" value={show.duration} onChange={(e) => setShow({ ...show, duration: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="thumbnailUrl">Thumbnail URL</label>
                <input className="w-full p-2 border rounded" type="text" id="thumbnailUrl" value={show.thumbnailUrl} onChange={(e) => setShow({ ...show, thumbnailUrl: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="displayOrder">Display Order</label>
                <input className="w-full p-2 border rounded" type="number" id="displayOrder" value={show.displayOrder || 0} onChange={(e) => setShow({ ...show, displayOrder: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input id="featured" type="checkbox" checked={!!show.featured} onChange={(e) => setShow({ ...show, featured: e.target.checked })} />
                <label className="text-sm font-medium" htmlFor="featured">Featured</label>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium" htmlFor="description">Description</label>
              <textarea className="w-full p-2 border rounded" rows={4} id="description" value={show.description} onChange={(e) => setShow({ ...show, description: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="youtubeUrl">YouTube URL</label>
                <input className="w-full p-2 border rounded" type="text" id="youtubeUrl" value={show.youtubeUrl} onChange={(e) => setShow({ ...show, youtubeUrl: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="commissioned">Commissioned</label>
                <input className="w-full p-2 border rounded" type="text" id="commissioned" value={show.commissioned} onChange={(e) => setShow({ ...show, commissioned: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="programCoordinator">Program Coordinator</label>
                <input className="w-full p-2 border rounded" type="text" id="programCoordinator" value={show.programCoordinator} onChange={(e) => setShow({ ...show, programCoordinator: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="percussionArranger">Percussion Arranger</label>
                <input className="w-full p-2 border rounded" type="text" id="percussionArranger" value={show.percussionArranger} onChange={(e) => setShow({ ...show, percussionArranger: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="soundDesigner">Sound Designer</label>
                <input className="w-full p-2 border rounded" type="text" id="soundDesigner" value={show.soundDesigner} onChange={(e) => setShow({ ...show, soundDesigner: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="windArranger">Wind Arranger</label>
                <input className="w-full p-2 border rounded" type="text" id="windArranger" value={show.windArranger} onChange={(e) => setShow({ ...show, windArranger: e.target.value })} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium" htmlFor="drillWriter">Drill Writer</label>
                <input className="w-full p-2 border rounded" type="text" id="drillWriter" value={show.drillWriter} onChange={(e) => setShow({ ...show, drillWriter: e.target.value })} />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium">Tags</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded bg-muted/30">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">{tag.name}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={saving || !show.name}
                className="flex-1"
              >
                {saving ? 'Saving…' : 'Save Show Changes'}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/shows')}
              >
                Cancel
              </Button>
            </div>
            {!show.name && (
              <p className="text-sm text-destructive text-center">Please fill in the required name field before saving</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Arrangements Section */}
      <div className="max-w-6xl mx-auto mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Arrangements</h2>
          <Button 
            onClick={() => setShowAddArrangementForm(!showAddArrangementForm)}
            variant={showAddArrangementForm ? "outline" : "default"}
          >
            {showAddArrangementForm ? 'Cancel' : '+ Add Arrangement'}
          </Button>
        </div>

        {/* Add New Arrangement Form */}
        {showAddArrangementForm && (
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Add New Arrangement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleArrangementSubmit} className="space-y-4">
                {saveError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    {saveError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Title <span className="text-destructive">*</span></label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.title} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, title: e.target.value })} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Type</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.type} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, type: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Composer</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.composer} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, composer: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Music Arranger</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.arranger} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, arranger: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Percussion Arranger</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.percussionArranger} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, percussionArranger: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Scene</label>
                    <select 
                      className="w-full p-2 border rounded" 
                      value={newArrangement.scene} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, scene: e.target.value })} 
                    >
                      <option value="">Select scene...</option>
                      <option value="Opener">Opener</option>
                      <option value="Ballad">Ballad</option>
                      <option value="Closer">Closer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Grade</label>
                    <select 
                      className="w-full p-2 border rounded" 
                      value={newArrangement.grade} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, grade: e.target.value })} 
                    >
                      <option value="">Select grade...</option>
                      <option value="1_2">Grade 1-2</option>
                      <option value="3_4">Grade 3-4</option>
                      <option value="5_plus">Grade 5+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Ensemble Size</label>
                    <select 
                      className="w-full p-2 border rounded" 
                      value={newArrangement.ensembleSize} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, ensembleSize: e.target.value })} 
                    >
                      <option value="">Select size...</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Year</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="number" 
                      value={newArrangement.year} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, year: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Duration (seconds)</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="number" 
                      value={newArrangement.durationSeconds} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, durationSeconds: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Order in Show</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="number" 
                      value={newArrangement.displayOrder} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, displayOrder: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Copyright Amount (USD)</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="number" 
                      step="0.01"
                      value={newArrangement.copyrightAmountUsd} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, copyrightAmountUsd: e.target.value })} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium">Description</label>
                    <textarea 
                      className="w-full p-2 border rounded" 
                      rows={3}
                      value={newArrangement.description} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, description: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">YouTube URL</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.youtubeUrl} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, youtubeUrl: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Sample Score URL</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.sampleScoreUrl} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, sampleScoreUrl: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Commissioned</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      type="text" 
                      value={newArrangement.commissioned} 
                      onChange={(e) => setNewArrangement({ ...newArrangement, commissioned: e.target.value })} 
                    />
          </div>
          </div>
          
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving || !newArrangement.title.trim()}
                    className="flex-1"
                  >
                    {saving ? 'Adding...' : 'Add Arrangement'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddArrangementForm(false);
                      setNewArrangement({
                        title: '',
                        type: '',
                        composer: '',
                        arranger: '',
                        percussionArranger: '',
                        description: '',
                        grade: '',
                        year: '',
                        durationSeconds: '',
                        scene: '',
                        ensembleSize: '',
                        youtubeUrl: '',
                        commissioned: '',
                        sampleScoreUrl: '',
                        copyrightAmountUsd: '',
                        displayOrder: ''
                      });
                      setSaveError(null);
                    }}
                  >
                    Cancel
                  </Button>
          </div>
        </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Arrangements */}
        <div className="space-y-6">
              {arrangements.map(arrangement => (
            <Card key={arrangement.id} className="frame-card">
              <CardContent className="p-6">
                {editingArrangement === arrangement.id ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Editing: {arrangement.title}</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingArrangement(null);
                            setEditingArrangementData(null);
                            setSaveError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleSaveArrangement(arrangement.id)}
                          disabled={savingArrangement === arrangement.id}
                        >
                          {savingArrangement === arrangement.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                    {saveError && editingArrangement === arrangement.id && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                        {saveError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium">Title <span className="text-destructive">*</span></label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.title || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, title: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Type</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.type || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, type: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Composer</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.composer || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, composer: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Arranger</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.arranger || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, arranger: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Percussion Arranger</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.percussionArranger || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, percussionArranger: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Scene</label>
                        <select 
                          className="w-full p-2 border rounded" 
                          value={editingArrangementData?.scene || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, scene: e.target.value })} 
                        >
                          <option value="">Select scene...</option>
                          <option value="Opener">Opener</option>
                          <option value="Ballad">Ballad</option>
                          <option value="Closer">Closer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Grade</label>
                        <select 
                          className="w-full p-2 border rounded" 
                          value={editingArrangementData?.grade || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, grade: e.target.value })} 
                        >
                          <option value="">Select grade...</option>
                          <option value="1_2">Grade 1-2</option>
                          <option value="3_4">Grade 3-4</option>
                          <option value="5_plus">Grade 5+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Ensemble Size</label>
                        <select 
                          className="w-full p-2 border rounded" 
                          value={editingArrangementData?.ensembleSize || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, ensembleSize: e.target.value })} 
                        >
                          <option value="">Select size...</option>
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Year</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="number" 
                          value={editingArrangementData?.year || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, year: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Duration (seconds)</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="number" 
                          value={editingArrangementData?.durationSeconds || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, durationSeconds: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Order in Show</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="number" 
                          value={editingArrangementData?.displayOrder || 0} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, displayOrder: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Copyright Amount (USD)</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="number" 
                          step="0.01"
                          value={editingArrangementData?.copyrightAmountUsd || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, copyrightAmountUsd: e.target.value })} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block mb-2 text-sm font-medium">Description</label>
                        <textarea 
                          className="w-full p-2 border rounded" 
                          rows={3}
                          value={editingArrangementData?.description || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, description: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">YouTube URL</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.youtubeUrl || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, youtubeUrl: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Sample Score URL</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.sampleScoreUrl || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, sampleScoreUrl: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">Commissioned</label>
                        <input 
                          className="w-full p-2 border rounded" 
                          type="text" 
                          value={editingArrangementData?.commissioned || ''} 
                          onChange={(e) => setEditingArrangementData({ ...editingArrangementData, commissioned: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{arrangement.title || 'Untitled'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {arrangement.type && <span>Type: {arrangement.type}</span>}
                          {arrangement.displayOrder !== undefined && <span className="ml-2">Order: {arrangement.displayOrder}</span>}
                          {arrangement.scene && <span className="ml-2">Scene: {arrangement.scene}</span>}
                        </p>
                        {(arrangement.composer || arrangement.arranger || arrangement.percussionArranger || arrangement.percussion_arranger) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {arrangement.composer && <span>Composer: {arrangement.composer}</span>}
                            {arrangement.arranger && <span className="ml-2">Arranger: {arrangement.arranger}</span>}
                            {(arrangement.percussionArranger || arrangement.percussion_arranger) && (
                              <span className="ml-2">Percussion: {arrangement.percussionArranger || arrangement.percussion_arranger}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditArrangement(arrangement)}>
                          Edit
                        </Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </div>
                    
                    {/* File Upload for this Arrangement */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Upload Files for this Arrangement</h4>
                      <FileUpload 
                        arrangementId={arrangement.id}
                        showId={id ? Number(id) : undefined}
                        allowedTypes={['audio', 'image', 'pdf', 'score']}
                        onUploadSuccess={() => setFilesVersion(v => v + 1)}
                        onUploadError={(err) => console.error('Upload error:', err)}
                      />
                      
                      {/* Gallery of files for this arrangement */}
                      <div className="mt-4">
                        <FileGallery 
                          key={`arrangement-${arrangement.id}-${filesVersion}`}
                          arrangementId={arrangement.id}
                          editable
                          onFileDelete={() => setFilesVersion(v => v + 1)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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