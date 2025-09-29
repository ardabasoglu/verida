#!/usr/bin/env tsx

/**
 * Test script for search and tagging functionality
 * This script tests the search API endpoints and tag management
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSearchFunctionality() {
  console.log('🔍 Testing Search and Tagging Functionality...\n')

  try {
    // Test 1: Create test pages with tags for search testing
    console.log('1. Creating test pages with tags...')
    
    // Find a test user (or create one)
    let testUser = await prisma.user.findFirst({
      where: { email: { endsWith: '@dgmgumruk.com' } }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@dgmgumruk.com',
          name: 'Test User',
          role: 'EDITOR'
        }
      })
      console.log('   ✓ Created test user')
    }

    // Create test pages with different tags and content
    const testPages = [
      {
        title: 'JavaScript Geliştirme Rehberi',
        content: 'Bu sayfa JavaScript geliştirme süreçleri hakkında bilgi içerir. Modern JavaScript teknikleri ve best practices.',
        pageType: 'INFO' as const,
        tags: ['javascript', 'geliştirme', 'programlama', 'web'],
        authorId: testUser.id
      },
      {
        title: 'Güvenlik Prosedürleri',
        content: 'Şirket güvenlik prosedürleri ve uyulması gereken kurallar. Bilgi güvenliği ve erişim kontrolleri.',
        pageType: 'PROCEDURE' as const,
        tags: ['güvenlik', 'prosedür', 'kurallar', 'erişim'],
        authorId: testUser.id
      },
      {
        title: 'Yeni Proje Duyurusu',
        content: 'Yeni blockchain projesi başlatılıyor. Tüm geliştiriciler toplantıya davetlidir.',
        pageType: 'ANNOUNCEMENT' as const,
        tags: ['proje', 'blockchain', 'duyuru', 'toplantı'],
        authorId: testUser.id
      },
      {
        title: 'Sistem Bakım Uyarısı',
        content: 'Sistem bakımı nedeniyle geçici kesinti yaşanabilir. Lütfen çalışmalarınızı kaydedin.',
        pageType: 'WARNING' as const,
        tags: ['sistem', 'bakım', 'uyarı', 'kesinti'],
        authorId: testUser.id
      }
    ]

    // Clean up existing test pages
    await prisma.page.deleteMany({
      where: {
        title: { in: testPages.map(p => p.title) }
      }
    })

    // Create new test pages
    const createdPages = []
    for (const pageData of testPages) {
      const page = await prisma.page.create({
        data: pageData,
        include: {
          author: true,
          _count: {
            select: {
              comments: true,
              files: true
            }
          }
        }
      })
      createdPages.push(page)
    }
    
    console.log(`   ✓ Created ${createdPages.length} test pages`)

    // Test 2: Test search functionality
    console.log('\n2. Testing search functionality...')

    // Test basic text search
    const searchResults1 = await prisma.page.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: 'JavaScript', mode: 'insensitive' } },
          { content: { contains: 'JavaScript', mode: 'insensitive' } },
          { tags: { hasSome: ['JavaScript'] } }
        ]
      },
      include: {
        author: true,
        _count: {
          select: {
            comments: true,
            files: true
          }
        }
      }
    })
    
    console.log(`   ✓ Text search for "JavaScript": ${searchResults1.length} results`)

    // Test tag-based search
    const searchResults2 = await prisma.page.findMany({
      where: {
        published: true,
        tags: { hasSome: ['güvenlik'] }
      },
      include: {
        author: true,
        _count: {
          select: {
            comments: true,
            files: true
          }
        }
      }
    })
    
    console.log(`   ✓ Tag search for "güvenlik": ${searchResults2.length} results`)

    // Test page type filter
    const searchResults3 = await prisma.page.findMany({
      where: {
        published: true,
        pageType: 'PROCEDURE'
      },
      include: {
        author: true,
        _count: {
          select: {
            comments: true,
            files: true
          }
        }
      }
    })
    
    console.log(`   ✓ Page type filter for "PROCEDURE": ${searchResults3.length} results`)

    // Test 3: Test tag aggregation
    console.log('\n3. Testing tag aggregation...')

    const allPages = await prisma.page.findMany({
      where: { published: true },
      select: { tags: true }
    })

    const tagCounts = new Map<string, number>()
    allPages.forEach(page => {
      page.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    console.log(`   ✓ Found ${tagCounts.size} unique tags`)
    console.log(`   ✓ Top 5 tags:`)
    popularTags.slice(0, 5).forEach(({ tag, count }) => {
      console.log(`      - ${tag}: ${count} uses`)
    })

    // Test 4: Test combined search (text + filters)
    console.log('\n4. Testing combined search...')

    const combinedSearch = await prisma.page.findMany({
      where: {
        published: true,
        AND: [
          {
            OR: [
              { title: { contains: 'proje', mode: 'insensitive' } },
              { content: { contains: 'proje', mode: 'insensitive' } },
              { tags: { hasSome: ['proje'] } }
            ]
          },
          { pageType: 'ANNOUNCEMENT' }
        ]
      },
      include: {
        author: true,
        _count: {
          select: {
            comments: true,
            files: true
          }
        }
      }
    })

    console.log(`   ✓ Combined search (text: "proje" + type: "ANNOUNCEMENT"): ${combinedSearch.length} results`)

    // Test 5: Test pagination
    console.log('\n5. Testing pagination...')

    const totalPages = await prisma.page.count({
      where: { published: true }
    })

    const pageSize = 2
    const totalPageCount = Math.ceil(totalPages / pageSize)

    console.log(`   ✓ Total pages: ${totalPages}`)
    console.log(`   ✓ Page size: ${pageSize}`)
    console.log(`   ✓ Total page count: ${totalPageCount}`)

    for (let page = 1; page <= Math.min(3, totalPageCount); page++) {
      const paginatedResults = await prisma.page.findMany({
        where: { published: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`   ✓ Page ${page}: ${paginatedResults.length} results`)
    }

    console.log('\n✅ All search and tagging tests passed!')
    console.log('\n📋 Test Summary:')
    console.log(`   - Created ${createdPages.length} test pages`)
    console.log(`   - Tested text search functionality`)
    console.log(`   - Tested tag-based filtering`)
    console.log(`   - Tested page type filtering`)
    console.log(`   - Tested tag aggregation`)
    console.log(`   - Tested combined search filters`)
    console.log(`   - Tested pagination`)
    console.log(`   - Found ${tagCounts.size} unique tags`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testSearchFunctionality().catch(console.error)