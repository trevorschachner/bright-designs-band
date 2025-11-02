import { ArrowLeft, Play, Download, Clock, Music2, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AudioPlayerComponent, audioPlayerStyles } from "@/components/features/audio-player"
import { db } from "@/lib/database"
import { arrangements, showArrangements, shows } from "@/lib/database/schema"
import { eq, desc } from "drizzle-orm"
import { getFilesByArrangementId } from "@/lib/database/queries"

export default async function ArrangementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const arrangementId = Number(id);

  const [arr] = await db
    .select()
    .from(arrangements)
    .where(eq(arrangements.id, arrangementId))
    .limit(1);

  if (!arr) {
    return <div className="container mx-auto px-4 py-12">Arrangement not found</div>;
  }

  const join = await db
    .select({ showId: showArrangements.showId })
    .from(showArrangements)
    .where(eq(showArrangements.arrangementId, arrangementId))
    .limit(1);

  let parentShow: { id: number; title?: string | null; name?: string | null } | null = null;
  if (join[0]?.showId) {
    const [s] = await db
      .select({ id: shows.id, title: shows.title, name: shows.name })
      .from(shows)
      .where(eq(shows.id, join[0].showId))
      .limit(1);
    parentShow = s ?? null;
  }

  const files = await getFilesByArrangementId(arrangementId);
  const audio = Array.isArray(files) ? files.find((f: any) => f.fileType === 'audio' && f.is_public) : undefined;

  const formatSeconds = (total?: number | null) => {
    if (!total || total < 0) return '—'
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: audioPlayerStyles }} />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" asChild>
            <Link href={parentShow ? `/shows/${parentShow.id}` : '/shows'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {parentShow ? 'Back to Show' : 'Back to Shows'}
            </Link>
          </Button>
        </div>

        {/* Arrangement Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left side - Media */}
          <div className="relative">
            <div className="w-full h-80 bg-muted rounded-lg shadow-lg flex items-center justify-center">
              <div className="text-muted-foreground">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {arr.scene ? (<Badge variant="outline" className="text-sm">{String(arr.scene)}</Badge>) : null}
            </div>

            <h1 className="text-4xl font-bold mb-2 text-foreground font-primary">{arr.title}</h1>
            {parentShow ? (
              <p className="text-lg text-bright-primary mb-4">
                From:{" "}
                <Link href={`/shows/${parentShow.id}`} className="hover:underline">
                  {String(parentShow.name || parentShow.title || '')}
                </Link>
              </p>
            ) : null}
            <p className="text-lg text-muted-foreground mb-6">{arr.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-sm">{formatSeconds(arr.durationSeconds as any)}</span>
              </div>
              {arr.composer ? (
                <div className="flex items-center">
                  <Music2 className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-sm">{arr.composer}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {arr.sampleScoreUrl ? (
                <Button variant="outline" asChild>
                  <Link href={arr.sampleScoreUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Sample Score
                  </Link>
                </Button>
              ) : null}
              {audio?.url ? (
                <Button variant="outline" asChild>
                  <Link href={audio.url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-2" />
                    Audio Preview
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Audio Player Section */}
        {audio?.url ? (
          <AudioPlayerComponent 
            tracks={[{ id: 'full', title: 'Full Arrangement', duration: '', description: '', type: 'Full Track', url: audio.url }]}
            title="Arrangement Audio Preview"
            className="bg-card/80 backdrop-blur-sm"
          />
        ) : null}
      </div>
    </div>
  )
}
