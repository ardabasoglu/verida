import { join } from 'path'
import { existsSync } from 'fs'
import { unlink } from 'fs/promises'

export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024

// File type validation
export const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

// File extensions mapping
export const fileExtensions: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp']
}

// File type labels for UI
export const fileTypeLabels: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WebP'
}

// File icons for UI
export const fileIcons: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️'
}

/**
 * Validate file type and extension
 */
export function validateFileType(file: File): { isValid: boolean; error?: string } {
  // Check MIME type
  if (!allowedFileTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Desteklenmeyen dosya türü. Sadece PDF, Word, Excel ve resim dosyaları kabul edilir.'
    }
  }

  // Check file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = fileExtensions[file.type] || []
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'Dosya uzantısı MIME türü ile uyuşmuyor.'
    }
  }

  return { isValid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): { isValid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.floor(MAX_FILE_SIZE / (1024 * 1024))
    return {
      isValid: false,
      error: `Dosya boyutu çok büyük. Maksimum boyut ${maxSizeMB}MB'dır.`
    }
  }

  return { isValid: true }
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = originalName.split('.').pop() || ''
  return `${timestamp}_${randomString}.${fileExtension}`
}

/**
 * Get file path
 */
export function getFilePath(filename: string): string {
  return join(UPLOAD_DIR, filename)
}

/**
 * Check if file exists on disk
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath)
}

/**
 * Delete file from disk
 */
export async function deleteFileFromDisk(filePath: string): Promise<void> {
  if (fileExists(filePath)) {
    await unlink(filePath)
  }
}

/**
 * Get file type label for UI
 */
export function getFileTypeLabel(mimeType: string): string {
  return fileTypeLabels[mimeType] || 'Dosya'
}

/**
 * Get file icon for UI
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  return fileIcons[mimeType] || '📎'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if file type is image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Get content disposition header for file download
 */
export function getContentDisposition(filename: string, inline = true): string {
  const disposition = inline ? 'inline' : 'attachment'
  return `${disposition}; filename="${filename}"`
}