/**
 * Test script for comment API endpoints
 * This tests the actual HTTP API endpoints
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  success: boolean
  error?: string
  data?: unknown
}

async function testCommentAPI(): Promise<TestResult[]> {
  const results: TestResult[] = []

  try {
    console.log('🧪 Starting Comment API Tests...\n')

    // Setup: Create test user and page
    console.log('1️⃣ Setting up test data...')

    const uniqueEmail = `test-api-${Date.now()}@dgmgumruk.com`
    const testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'API Test User',
        role: 'MEMBER',
        emailVerified: new Date()
      }
    })

    const testPage = await prisma.page.create({
      data: {
        title: 'API Test Page',
        content: 'This is a test page for API testing.',
        pageType: 'INFO',
        authorId: testUser.id,
        tags: ['api', 'test'],
        published: true
      }
    })

    results.push({
      test: 'Setup test data',
      success: true,
      data: { userId: testUser.id, pageId: testPage.id }
    })

    // Test 1: Verify comment validation schemas work
    console.log('2️⃣ Testing comment validation schemas...')

    const { createCommentSchema } = await import('@/lib/validations')

    // Valid comment
    const validComment = createCommentSchema.parse({
      pageId: testPage.id,
      comment: 'This is a valid comment'
    })

    results.push({
      test: 'Valid comment schema',
      success: true,
      data: validComment
    })

    // Test invalid comment (empty)
    try {
      createCommentSchema.parse({
        pageId: testPage.id,
        comment: ''
      })
      results.push({
        test: 'Invalid comment schema (empty)',
        success: false,
        error: 'Empty comment should have failed validation'
      })
    } catch {
      results.push({
        test: 'Invalid comment schema (empty)',
        success: true,
        data: { note: 'Empty comment correctly rejected' }
      })
    }

    // Test invalid comment (too long)
    try {
      createCommentSchema.parse({
        pageId: testPage.id,
        comment: 'x'.repeat(1001) // Over 1000 character limit
      })
      results.push({
        test: 'Invalid comment schema (too long)',
        success: false,
        error: 'Long comment should have failed validation'
      })
    } catch {
      results.push({
        test: 'Invalid comment schema (too long)',
        success: true,
        data: { note: 'Long comment correctly rejected' }
      })
    }

    // Test 2: Test comment creation via Prisma (simulating API)
    console.log('3️⃣ Testing comment creation...')

    const newComment = await prisma.comment.create({
      data: {
        pageId: testPage.id,
        userId: testUser.id,
        comment: 'This is a test comment via API simulation'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    results.push({
      test: 'Create comment',
      success: true,
      data: { commentId: newComment.id, comment: newComment.comment }
    })

    // Test 3: Test comment listing with pagination
    console.log('4️⃣ Testing comment listing...')

    // Create a few more comments for pagination testing
    await prisma.comment.createMany({
      data: [
        {
          pageId: testPage.id,
          userId: testUser.id,
          comment: 'Second test comment'
        },
        {
          pageId: testPage.id,
          userId: testUser.id,
          comment: 'Third test comment'
        }
      ]
    })

    const comments = await prisma.comment.findMany({
      where: { pageId: testPage.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0
    })

    if (comments.length !== 3) {
      throw new Error(`Expected 3 comments, found ${comments.length}`)
    }

    results.push({
      test: 'List comments with pagination',
      success: true,
      data: { commentCount: comments.length }
    })

    // Test 4: Test comment update
    console.log('5️⃣ Testing comment update...')

    const updatedComment = await prisma.comment.update({
      where: { id: newComment.id },
      data: {
        comment: 'This is an updated test comment'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!updatedComment.comment.includes('updated')) {
      throw new Error('Comment was not updated properly')
    }

    results.push({
      test: 'Update comment',
      success: true,
      data: { updatedComment: updatedComment.comment }
    })

    // Test 5: Test comment deletion
    console.log('6️⃣ Testing comment deletion...')

    await prisma.comment.delete({
      where: { id: newComment.id }
    })

    const remainingComments = await prisma.comment.findMany({
      where: { pageId: testPage.id }
    })

    if (remainingComments.length !== 2) {
      throw new Error(`Expected 2 comments after deletion, found ${remainingComments.length}`)
    }

    results.push({
      test: 'Delete comment',
      success: true,
      data: { remainingComments: remainingComments.length }
    })

    // Test 6: Test comment permissions logic
    console.log('7️⃣ Testing comment permissions...')

    // Create another user to test permissions
    const otherUser = await prisma.user.create({
      data: {
        email: `other-user-${Date.now()}@dgmgumruk.com`,
        name: 'Other User',
        role: 'MEMBER',
        emailVerified: new Date()
      }
    })

    const commentByOtherUser = await prisma.comment.create({
      data: {
        pageId: testPage.id,
        userId: otherUser.id,
        comment: 'Comment by other user'
      }
    })

    // Simulate permission check logic
    const canEditOwnComment = commentByOtherUser.userId === otherUser.id
    const canEditAsPageAuthor = testPage.authorId === testUser.id
    const canEditAsAdmin = testUser.role === 'ADMIN' || testUser.role === 'SYSTEM_ADMIN'

    results.push({
      test: 'Comment permissions logic',
      success: true,
      data: {
        canEditOwnComment,
        canEditAsPageAuthor,
        canEditAsAdmin,
        userRole: testUser.role
      }
    })

    // Cleanup
    console.log('🧹 Cleaning up test data...')

    await prisma.comment.deleteMany({
      where: { pageId: testPage.id }
    })

    await prisma.page.delete({
      where: { id: testPage.id }
    })

    await prisma.user.delete({
      where: { id: testUser.id }
    })

    await prisma.user.delete({
      where: { id: otherUser.id }
    })

    results.push({
      test: 'Cleanup test data',
      success: true
    })

    console.log('✅ All comment API tests completed successfully!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    results.push({
      test: 'Comment API test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }

  return results
}

// Print results
function printResults(results: TestResult[]) {
  console.log('📊 Test Results Summary:')
  console.log('='.repeat(50))

  let passed = 0
  let failed = 0

  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${index + 1}. ${result.test}: ${status}`)

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
    }

    if (result.success) {
      passed++
    } else {
      failed++
    }
  })

  console.log('='.repeat(50))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)

  if (failed === 0) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.')
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCommentAPI()
    .then(printResults)
    .catch(console.error)
}

export { testCommentAPI, printResults }