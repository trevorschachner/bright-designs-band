'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText, 
  File, 
  Download, 
  Trash2, 
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { AudioPlayerComponent } from './audio-player'
import { YouTubePlayer } from './youtube-player'

interface FileRecord {
  id: number
  fileName: string
  originalName: string
  fileType: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'
  fileSize: number
  mimeType: string
  url: string
  storagePath: string
  showId?: number
  arrangementId?: number
  isPublic: boolean
  description?: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

interface FileGalleryProps {
  showId?: number
  arrangementId?: number
  fileType?: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'
  editable?: boolean
  onFileDelete?: (fileId: number) => void
}

export function FileGallery({ 
  showId, 
  arrangementId, 
  fileType, 
  editable = false,
  onFileDelete 
}: FileGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (showId) params.append('showId', showId.toString())
      if (arrangementId) params.append('arrangementId', arrangementId.toString())
      if (fileType) params.append('fileType', fileType)

      const response = await fetch(`/api/files?${params}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch files')
      }

      // Extract files from API response (data is wrapped in SuccessResponse)
      let filteredFiles = Array.isArray(result.data) ? result.data : []

      // Additional filtering (though API already filters by showId/arrangementId/fileType)
      if (showId) {
        filteredFiles = filteredFiles.filter((f: FileRecord) => f.showId === showId)
      }
      if (arrangementId) {
        filteredFiles = filteredFiles.filter((f: FileRecord) => f.arrangementId === arrangementId)
      }
      if (fileType) {
        filteredFiles = filteredFiles.filter((f: FileRecord) => f.fileType === fileType)
      }

      // Sort by display order then by creation date
      filteredFiles.sort((a: FileRecord, b: FileRecord) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      setFiles(filteredFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [showId, arrangementId, fileType])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete file')
      }

      setFiles(files.filter(f => f.id !== fileId))
      onFileDelete?.(fileId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-6 h-6" />
      case 'audio': return <Music className="w-6 h-6" />
      case 'youtube': return <Video className="w-6 h-6" />
      case 'pdf': return <FileText className="w-6 h-6" />
      case 'score': return <FileText className="w-6 h-6" />
      default: return <File className="w-6 h-6" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderFilePreview = (file: FileRecord) => {
    switch (file.fileType) {
      case 'image':
        return (
          <AspectRatio ratio={16 / 9}>
            <Image
              src={file.url}
              alt={file.originalName}
              fill
              className="object-cover rounded-lg"
              unoptimized
            />
          </AspectRatio>
        )
      
             case 'audio':
         return (
           <div className="p-4 bg-muted/30 rounded-lg">
             <div className="flex items-center space-x-2 mb-3">
               <Music className="w-5 h-5 text-bright-primary" />
               <span className="font-medium">{file.originalName}</span>
             </div>
             <AudioPlayerComponent 
               tracks={[{
                 id: file.id.toString(),
                 title: file.originalName,
                 description: file.description,
                 url: file.url
               }]}
             />
           </div>
         )
      
             case 'youtube':
         return (
           <div className="p-4 bg-muted/30 rounded-lg">
             <div className="flex items-center space-x-2 mb-3">
               <Video className="w-5 h-5 text-bright-primary" />
               <span className="font-medium">{file.originalName}</span>
             </div>
             <YouTubePlayer youtubeUrl={file.url} />
           </div>
         )
      
      case 'pdf':
      case 'score':
        return (
          <div className="p-8 bg-muted/30 rounded-lg text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.fileSize)}</p>
            <div className="flex space-x-2 mt-4 justify-center">
              <Button size="sm" variant="outline" asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={file.url} download={file.originalName}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="p-8 bg-muted/30 rounded-lg text-center">
            <File className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.fileSize)}</p>
            <Button size="sm" variant="outline" className="mt-4" asChild>
              <a href={file.url} download={file.originalName}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <Card className="frame-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading files...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (files.length === 0) {
    return (
      <Card className="frame-card">
        <CardContent className="text-center py-8">
          <File className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No files found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {fileType ? `No ${fileType} files` : 'No files'} have been uploaded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {fileType === 'image' ? (
        // Grid layout for images
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <Card key={file.id} className="frame-card">
              <CardContent className="p-4">
                {renderFilePreview(file)}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{file.originalName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {file.fileType}
                    </Badge>
                  </div>
                  {file.description && (
                    <p className="text-xs text-muted-foreground mb-2">{file.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                    {editable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List layout for other file types
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[80px]">Public</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    {getFileIcon(file.fileType)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[300px]" title={file.originalName}>
                        {file.originalName}
                      </span>
                      {/* Optional inline preview for audio could go here if needed, but keeping it simple for now */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.fileType}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{file.description || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={file.isPublic ? "default" : "secondary"}>
                      {file.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      {editable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(file.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 