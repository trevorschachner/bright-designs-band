import { createClient } from '@/lib/utils/supabase/client'

export interface FileUploadResult {
  success: boolean
  data?: {
    fileName: string
    url: string
    storagePath: string
    fileSize: number
    mimeType: string
  }
  error?: string
}

export interface FileUploadOptions {
  showId?: number
  arrangementId?: number
  fileType: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'
  isPublic?: boolean
  description?: string
  displayOrder?: number
}

export class FileStorageService {
  private supabase = createClient()

  // Upload file to Supabase Storage
  async uploadFile(file: File, options: FileUploadOptions): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options.fileType)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomId}.${fileExtension}`
      
      // Determine storage path based on type and association
      const storagePath = this.generateStoragePath(fileName, options)

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await this.supabase.storage
        .from('files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        console.error('Storage upload error:', storageError)
        return { success: false, error: 'Failed to upload file to storage' }
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('files')
        .getPublicUrl(storagePath)

      return {
        success: true,
        data: {
          fileName,
          url: publicUrl,
          storagePath,
          fileSize: file.size,
          mimeType: file.type
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
      return { success: false, error: 'An unexpected error occurred during upload' }
    }
  }

  // Delete file from Supabase Storage
  async deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from('files')
        .remove([storagePath])

      if (error) {
        console.error('Storage delete error:', error)
        return { success: false, error: 'Failed to delete file from storage' }
      }

      return { success: true }
    } catch (error) {
      console.error('File delete error:', error)
      return { success: false, error: 'An unexpected error occurred during deletion' }
    }
  }

  // Generate storage path based on file type and association
  private generateStoragePath(fileName: string, options: FileUploadOptions): string {
    const { fileType, showId, arrangementId } = options
    
    if (showId && arrangementId) {
      return `shows/${showId}/arrangements/${arrangementId}/${fileType}/${fileName}`
    } else if (showId) {
      return `shows/${showId}/${fileType}/${fileName}`
    } else if (arrangementId) {
      return `arrangements/${arrangementId}/${fileType}/${fileName}`
    } else {
      return `general/${fileType}/${fileName}`
    }
  }

  // Validate file based on type and size constraints
  private validateFile(file: File, fileType: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'): { valid: boolean; error?: string } {
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024, // 10MB
      audio: 100 * 1024 * 1024, // 100MB
      youtube: 0, // No file upload for YouTube links
      pdf: 50 * 1024 * 1024, // 50MB
      score: 50 * 1024 * 1024, // 50MB
      other: 100 * 1024 * 1024 // 100MB
    }

    const allowedMimeTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac'],
      youtube: [], // No file upload for YouTube links
      pdf: ['application/pdf'],
      score: ['application/pdf', 'image/jpeg', 'image/png'],
      other: [] // Allow any file type for 'other'
    }

    const maxSize = maxSizes[fileType] || maxSizes.other
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB` 
      }
    }

    const allowedTypes = allowedMimeTypes[fileType] || []
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} is not allowed for ${fileType} files` 
      }
    }

    return { valid: true }
  }

  // Get file URL (handles both public and private files)
  getFileUrl(storagePath: string, isPublic: boolean = true): string {
    if (isPublic) {
      const { data: { publicUrl } } = this.supabase.storage
        .from('files')
        .getPublicUrl(storagePath)
      return publicUrl
    } else {
      // For private files, you'd need to create a signed URL
      // This is a placeholder - implement signed URLs as needed
      return `/api/files/download?path=${encodeURIComponent(storagePath)}`
    }
  }
}

export const fileStorage = new FileStorageService() 