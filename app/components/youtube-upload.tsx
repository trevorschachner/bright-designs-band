'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Video, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import { YouTubePlayer, isValidYouTubeUrl } from './youtube-player'

interface YouTubeUploadProps {
  showId?: number
  arrangementId?: number
  onUploadSuccess?: (file: any) => void
  onUploadError?: (error: string) => void
}

export function YouTubeUpload({ 
  showId, 
  arrangementId, 
  onUploadSuccess, 
  onUploadError 
}: YouTubeUploadProps) {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('YouTube URL is required')
      return
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/files/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          fileType: 'youtube',
          isPublic,
          description,
          displayOrder: 0,
          showId,
          arrangementId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setSuccess('YouTube video added successfully!')
      setUrl('')
      setDescription('')
      onUploadSuccess?.(result.file)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isValidUrl = url.trim() === '' || isValidYouTubeUrl(url)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Video className="w-5 h-5" />
          <span>Add YouTube Video</span>
        </CardTitle>
        <CardDescription>
          Add a YouTube video link
          {showId && ` to Show #${showId}`}
          {arrangementId && ` to Arrangement #${arrangementId}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtu.be/dQw4w9WgXcQ or https://youtube.com/watch?v=..."
              className={!isValidUrl ? 'border-red-500' : ''}
            />
            {!isValidUrl && (
              <p className="text-sm text-red-600">
                Please enter a valid YouTube URL
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the video"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label>Public video</Label>
          </div>

          {url && isValidUrl && (
            <div>
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2">
                <YouTubePlayer url={url} title={description || 'Preview'} />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || !url.trim() || !isValidUrl}
            className="w-full"
          >
            {isLoading ? (
              'Adding Video...'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add YouTube Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 