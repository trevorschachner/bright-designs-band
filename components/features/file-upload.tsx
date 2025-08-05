'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Music, 
  Video, 
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'

interface FileUploadProps {
  showId?: number
  arrangementId?: number
  onUploadSuccess?: (file: any) => void
  onUploadError?: (error: string) => void
  allowedTypes?: ('image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other')[]
  maxFiles?: number
}

interface UploadingFile {
  file?: File
  fileType: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'
  description: string
  isPublic: boolean
  displayOrder: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  id: string
  youtubeUrl?: string
}

export function FileUpload({ 
  showId, 
  arrangementId, 
  onUploadSuccess, 
  onUploadError,
  allowedTypes = ['image', 'audio', 'youtube', 'pdf', 'score', 'other'],
  maxFiles = 10
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'score': return <FileText className="w-4 h-4" />
      default: return <File className="w-4 h-4" />
    }
  }

  const detectFileType = (file: File): 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type === 'application/pdf') return 'pdf'
    return 'other'
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadingFile[] = Array.from(files).map(file => ({
      file,
      fileType: detectFileType(file),
      description: '',
      isPublic: true,
      displayOrder: uploadingFiles.length,
      progress: 0,
      status: 'pending' as const,
      id: Math.random().toString(36).substring(2, 15)
    }))

    if (uploadingFiles.length + newFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploadingFiles(prev => [...prev, ...newFiles])
  }

  const updateFile = (id: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ))
  }

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadFile = async (uploadingFile: UploadingFile) => {
    updateFile(uploadingFile.id, { status: 'uploading', progress: 10 })

    try {
      if (uploadingFile.fileType === 'youtube') {
        // Handle YouTube URL submission
        if (!uploadingFile.youtubeUrl) {
          throw new Error('YouTube URL is required')
        }

        const response = await fetch('/api/files/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadingFile.youtubeUrl,
            fileType: uploadingFile.fileType,
            isPublic: uploadingFile.isPublic,
            description: uploadingFile.description,
            displayOrder: uploadingFile.displayOrder,
            showId,
            arrangementId,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        updateFile(uploadingFile.id, { 
          status: 'success', 
          progress: 100 
        })

        onUploadSuccess?.(result.file)
      } else {
        // Handle regular file upload
        if (!uploadingFile.file) {
          throw new Error('File is required')
        }

        const formData = new FormData()
        formData.append('file', uploadingFile.file)
        formData.append('fileType', uploadingFile.fileType)
        formData.append('isPublic', uploadingFile.isPublic.toString())
        formData.append('description', uploadingFile.description)
        formData.append('displayOrder', uploadingFile.displayOrder.toString())
        
        if (showId) formData.append('showId', showId.toString())
        if (arrangementId) formData.append('arrangementId', arrangementId.toString())

        updateFile(uploadingFile.id, { progress: 50 })

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        updateFile(uploadingFile.id, { 
          status: 'success', 
          progress: 100 
        })

        onUploadSuccess?.(result.file)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      updateFile(uploadingFile.id, { 
        status: 'error', 
        progress: 0, 
        error: errorMessage 
      })
      onUploadError?.(errorMessage)
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = uploadingFiles.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const pendingFiles = uploadingFiles.filter(f => f.status === 'pending')
  const successFiles = uploadingFiles.filter(f => f.status === 'success')
  const errorFiles = uploadingFiles.filter(f => f.status === 'error')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>File Upload</span>
        </CardTitle>
        <CardDescription>
          Upload images, audio files, videos, PDFs, and other documents
          {showId && ` for Show #${showId}`}
          {arrangementId && ` for Arrangement #${arrangementId}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-bright-primary bg-bright-primary/5' 
              : 'border-gray-300 hover:border-bright-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports: Images, Audio, Video, PDF, and other documents
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* File List */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Files to Upload</h3>
              {pendingFiles.length > 0 && (
                <Button onClick={uploadAllFiles} className="ml-auto">
                  Upload All ({pendingFiles.length})
                </Button>
              )}
            </div>

            {uploadingFiles.map((uploadingFile) => (
              <Card key={uploadingFile.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadingFile.fileType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                                          <p className="text-sm font-medium truncate">
                      {uploadingFile.file?.name || uploadingFile.youtubeUrl || 'YouTube Video'}
                    </p>
                      <Badge variant="outline" className="text-xs">
                        {uploadingFile.fileType}
                      </Badge>
                      {uploadingFile.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>

                    {uploadingFile.status === 'pending' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label htmlFor={`fileType-${uploadingFile.id}`}>Type</Label>
                          <Select
                            value={uploadingFile.fileType}
                            onValueChange={(value: any) => 
                              updateFile(uploadingFile.id, { fileType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`description-${uploadingFile.id}`}>Description</Label>
                          <Input
                            id={`description-${uploadingFile.id}`}
                            placeholder="Optional description"
                            value={uploadingFile.description}
                            onChange={(e) => 
                              updateFile(uploadingFile.id, { description: e.target.value })
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={uploadingFile.isPublic}
                            onCheckedChange={(checked) => 
                              updateFile(uploadingFile.id, { isPublic: checked })
                            }
                          />
                          <Label>Public</Label>
                        </div>
                      </div>
                    )}

                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="mb-2" />
                    )}

                    {uploadingFile.status === 'error' && (
                      <Alert className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {uploadingFile.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs text-gray-500">
                      {uploadingFile.file ? (uploadingFile.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'YouTube Link'}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {uploadingFile.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => uploadFile(uploadingFile)}
                        >
                          Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(uploadingFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {uploadingFile.status === 'success' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(uploadingFile.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {uploadingFile.status === 'error' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => uploadFile(uploadingFile)}
                        >
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(uploadingFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Summary */}
            {(successFiles.length > 0 || errorFiles.length > 0) && (
              <div className="flex space-x-4 text-sm">
                {successFiles.length > 0 && (
                  <Badge variant="outline" className="text-green-600">
                    {successFiles.length} uploaded successfully
                  </Badge>
                )}
                {errorFiles.length > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    {errorFiles.length} failed
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 