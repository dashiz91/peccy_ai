import { createClient } from './client'

// Bucket names
export const BUCKETS = {
  UPLOADS: 'uploads',
  GENERATED: 'generated',
  STYLE_REFERENCES: 'style-references',
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: File,
  options?: {
    contentType?: string
    upsert?: boolean
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType || file.type,
      upsert: options?.upsert ?? false,
    })

  if (error) throw error
  return data
}

/**
 * Get a signed URL for a private file (valid for 1 hour)
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

/**
 * Get a public URL for a public file
 */
export function getPublicUrl(bucket: BucketName, path: string) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: BucketName, path: string) {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: BucketName,
  folder?: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', options)

  if (error) throw error
  return data
}

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  prefix?: string
): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop() || 'png'
  const safeName = prefix ? `${prefix}_${randomId}` : randomId

  return `${userId}/${timestamp}_${safeName}.${extension}`
}

/**
 * Generate path for generated images
 */
export function generateImagePath(
  sessionId: string,
  imageType: string,
  version: number = 1
): string {
  return `${sessionId}/${imageType}_v${version}.png`
}
