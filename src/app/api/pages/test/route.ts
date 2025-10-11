import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/pages/test - Test page management functionality
 */
export async function GET() {
  try {
    // Test database connection and page model
    const pageCount = await prisma.page.count()
    
    // Test ContentType enum values
    const contentTypes = ['INFO', 'PROCEDURE', 'ANNOUNCEMENT', 'WARNING']
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Page management API is working',
        pageCount,
        supportedContentTypes: contentTypes,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Page test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Page management test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}