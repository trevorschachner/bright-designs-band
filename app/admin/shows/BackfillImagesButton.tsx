'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export default function BackfillImagesButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'prefix' | 'search'>('prefix');
  const [prefixTemplate, setPrefixTemplate] = useState<string>('shows/{showId}/image');
  const [searchPrefixes, setSearchPrefixes] = useState<string>(''); // comma-separated
  const [setThumbnail, setSetThumbnail] = useState<boolean>(true);
  const [onlyMissing, setOnlyMissing] = useState<boolean>(true);
  const [mappingJson, setMappingJson] = useState<string>('');
  const [resultMsg, setResultMsg] = useState<string>('');

  const onSubmit = async () => {
    setIsSubmitting(true);
    setResultMsg('');
    try {
      let mapping: any[] = [];
      if (mappingJson.trim()) {
        try {
          mapping = JSON.parse(mappingJson);
        } catch (e) {
          setResultMsg('Invalid mapping JSON');
          setIsSubmitting(false);
          return;
        }
      }
      const body: any = {
        mode,
        setThumbnail,
        onlyMissing,
        ...(mode === 'prefix' ? { prefixTemplate } : {}),
        ...(mode === 'search' ? { prefixes: searchPrefixes.split(',').map(s => s.trim()).filter(Boolean) } : {}),
        ...(mapping.length > 0 ? { mapping } : {}),
      };
      const res = await fetch('/api/admin/shows/backfill-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setResultMsg(json.error || 'Backfill failed');
      } else {
        const totalInserted = (json.data?.results || []).reduce((sum: number, r: any) => sum + (r.inserted || 0), 0);
        const thumbs = (json.data?.results || []).reduce((sum: number, r: any) => sum + (r.thumbnailSet ? 1 : 0), 0);
        setResultMsg(`Done. Inserted ${totalInserted} images. Set ${thumbs} thumbnails.`);
      }
    } catch (e) {
      setResultMsg('Unexpected error during backfill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Backfill Images</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Backfill Show Images</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32">Mode</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="prefix"
                  checked={mode === 'prefix'}
                  onChange={() => setMode('prefix')}
                />
                Prefix
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="search"
                  checked={mode === 'search'}
                  onChange={() => setMode('search')}
                />
                Search
              </label>
            </div>
          </div>
          {mode === 'prefix' ? (
            <div className="flex items-center gap-4">
              <Label htmlFor="prefixTemplate" className="w-32">Prefix template</Label>
              <Input
                id="prefixTemplate"
                value={prefixTemplate}
                onChange={(e) => setPrefixTemplate(e.target.value)}
                placeholder="shows/{showId}/image"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Label htmlFor="searchPrefixes" className="w-32">Search prefixes</Label>
              <Input
                id="searchPrefixes"
                value={searchPrefixes}
                onChange={(e) => setSearchPrefixes(e.target.value)}
                placeholder="e.g. graphics,images,uploads"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Label className="w-32">Set thumbnail</Label>
            <Checkbox checked={setThumbnail} onCheckedChange={(v) => setSetThumbnail(Boolean(v))} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32">Only if missing</Label>
            <Checkbox checked={onlyMissing} onCheckedChange={(v) => setOnlyMissing(Boolean(v))} />
          </div>

          <div className="flex items-start gap-4">
            <Label htmlFor="mappingJson" className="w-32 pt-2">Mapping (JSON)</Label>
            <Textarea
              id="mappingJson"
              value={mappingJson}
              onChange={(e) => setMappingJson(e.target.value)}
              placeholder='[ { "showId": 1, "files": ["shows/1/image/cover.jpg"] } ]'
              className="min-h-28"
            />
          </div>
          {resultMsg ? <p className="text-sm text-muted-foreground">{resultMsg}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Running…' : 'Run backfill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


