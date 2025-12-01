import { createClient } from '@/lib/utils/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getStorageBucket, getStorageRootPrefix } from '@/lib/env'

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

// Centralized storage configuration
export const STORAGE_BUCKET = getStorageBucket()

// We keep DB storagePath values WITHOUT this prefix, and only prepend it
// when interacting with Supabase Storage so we don't have to migrate DB rows.
export const STORAGE_ROOT_PREFIX = getStorageRootPrefix()

export function withRootPrefix(path: string): string {
  const trimmed = String(path || '').replace(/^\/+/, '')
  return `${STORAGE_ROOT_PREFIX}/${trimmed}`
}

export class FileStorageService {
  private supabase: SupabaseClient | null = null

  // Set the Supabase client (should be server-side authenticated client for uploads)
  setClient(client: SupabaseClient) {
    this.supabase = client
  }

  // Get or create a client (fallback to client-side for backward compatibility)
  private getClient(): SupabaseClient {
    if (this.supabase) {
      return this.supabase
    }
    // Fallback to client-side client (for backward compatibility)
    return createClient() as any
  }

  // Upload file to Supabase Storage
  async uploadFile(file: File, options: FileUploadOptions, supabaseClient?: SupabaseClient): Promise<FileUploadResult> {
    try {
      // Use provided client or fallback to instance client
      const supabase = supabaseClient || this.getClient()

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

      console.log('Uploading file to storage:', {
        storagePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        options
      })

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(withRootPrefix(storagePath), file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        console.error('Storage upload error:', {
          message: storageError.message,
          error: storageError,
          storagePath
        })
        return { success: false, error: `Failed to upload file to storage: ${storageError.message}` }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(withRootPrefix(storagePath))

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
  async deleteFile(storagePath: string, supabaseClient?: SupabaseClient): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = supabaseClient || this.getClient()
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([withRootPrefix(storagePath)])

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
    
    // Special case: audio files for shows go into show_mp3s folder
    if (showId && !arrangementId && fileType === 'audio') {
      return `show_mp3s/${fileName}`
    }
    
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
  getFileUrl(storagePath: string, isPublic: boolean = true, supabaseClient?: SupabaseClient): string {
    const supabase = supabaseClient || this.getClient()
    if (isPublic) {
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(withRootPrefix(storagePath))
      return publicUrl
    } else {
      // For private files, you'd need to create a signed URL
      // This is a placeholder - implement signed URLs as needed
      return `/api/files/download?path=${encodeURIComponent(storagePath)}`
    }
  }
}

export const fileStorage = new FileStorageService() 