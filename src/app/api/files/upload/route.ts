import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { 
  UPLOAD_DIR, 
  validateFileType, 
  validateFileSize, 
  generateUniqueFilename, 
  getFilePath 
} from '@/lib/file-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role - only editors and above can upload files
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['EDITOR', 'ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file name
    if (!file.name || file.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya adı.' },
        { status: 400 }
      )
    }

    // Validate file type and extension
    const typeValidation = validateFileType(file)
    if (!typeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: typeValidation.error },
        { status: 400 }
      )
    }

    // Validate file size
    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: sizeValidation.error },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename and path
    const filename = generateUniqueFilename(file.name)
    const filePath = getFilePath(filename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: BigInt(file.size),
        filePath,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...fileRecord,
        fileSize: Number(fileRecord.fileSize), // Convert BigInt to number for JSON
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}