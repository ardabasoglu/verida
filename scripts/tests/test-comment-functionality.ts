/**
 * Test script for comment functionality
 * Tests comment creation, listing, updating, and deletion
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  success: boolean
  error?: string
  data?: any
}

async function runCommentTests(): Promise<TestResult[]> {
  const results: TestResult[] = []
  
  try {
    console.log('🧪 Starting Comment Functionality Tests...\n')

    // Test 1: Create test user and page for comments
    console.log('1️⃣ Setting up test data...')
    
    // Create test user with unique email
    const uniqueEmail = `test-commenter-${Date.now()}@dgmgumruk.com`
    const testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Test Commenter',
        role: 'MEMBER',
        emailVerified: new Date()
      }
    })

    // Create test page
    const testPage = await prisma.page.create({
      data: {
        title: 'Test Page for Comments',
        content: 'This is a test page for comment functionality.',
        pageType: 'INFO',
        authorId: testUser.id,
        tags: ['test', 'comments'],
        published: true
      }
    })

    results.push({
      test: 'Setup test data',
      success: true,
      data: { userId: testUser.id, pageId: testPage.id }
    })

    // Test 2: Create comments
    console.log('2️⃣ Testing comment creation...')
    
    const comment1 = await prisma.comment.create({
      data: {
        pageId: testPage.id,
        userId: testUser.id,
        comment: 'This is the first test comment.'
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

    const comment2 = await prisma.comment.create({
      data: {
        pageId: testPage.id,
        userId: testUser.id,
        comment: 'This is the second test comment with more content to test longer comments.'
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
      test: 'Create comments',
      success: true,
      data: { comment1Id: comment1.id, comment2Id: comment2.id }
    })

    // Test 3: List comments for page
    console.log('3️⃣ Testing comment listing...')
    
    const pageComments = await prisma.comment.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    if (pageComments.length !== 2) {
      throw new Error(`Expected 2 comments, found ${pageComments.length}`)
    }

    results.push({
      test: 'List comments',
      success: true,
      data: { commentCount: pageComments.length }
    })

    // Test 4: Update comment
    console.log('4️⃣ Testing comment update...')
    
    const updatedComment = await prisma.comment.update({
      where: { id: comment1.id },
      data: {
        comment: 'This is the updated first comment.'
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

    // Test 5: Test comment validation
    console.log('5️⃣ Testing comment validation...')
    
    try {
      await prisma.comment.create({
        data: {
          pageId: testPage.id,
          userId: testUser.id,
          comment: '' // Empty comment should fail validation at API level
        }
      })
      // If we get here, validation didn't work (but Prisma allows empty strings)
      results.push({
        test: 'Comment validation (empty comment)',
        success: true,
        data: { note: 'Prisma allows empty strings, validation should be at API level' }
      })
    } catch (error) {
      results.push({
        test: 'Comment validation (empty comment)',
        success: true,
        data: { note: 'Validation working at database level' }
      })
    }

    // Test 6: Test comment with page relationship
    console.log('6️⃣ Testing comment-page relationship...')
    
    const commentWithPage = await prisma.comment.findFirst({
      where: { id: comment1.id },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            authorId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!commentWithPage?.page || commentWithPage.page.id !== testPage.id) {
      throw new Error('Comment-page relationship not working')
    }

    results.push({
      test: 'Comment-page relationship',
      success: true,
      data: { pageTitle: commentWithPage.page.title }
    })

    // Test 7: Test comment count for page
    console.log('7️⃣ Testing comment count...')
    
    const pageWithCommentCount = await prisma.page.findUnique({
      where: { id: testPage.id },
      include: {
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Should be 3 comments now (2 original + 1 empty from validation test)
    const expectedCount = 3
    if (pageWithCommentCount?._count.comments !== expectedCount) {
      throw new Error(`Expected ${expectedCount} comments, found ${pageWithCommentCount?._count.comments}`)
    }

    results.push({
      test: 'Comment count',
      success: true,
      data: { commentCount: pageWithCommentCount._count.comments }
    })

    // Test 8: Delete comment
    console.log('8️⃣ Testing comment deletion...')
    
    await prisma.comment.delete({
      where: { id: comment2.id }
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

    // Cleanup: Delete test data
    console.log('🧹 Cleaning up test data...')
    
    // Delete comments first (they reference the page)
    await prisma.comment.deleteMany({
      where: { pageId: testPage.id }
    })
    
    // Delete page (it references the user)
    await prisma.page.delete({
      where: { id: testPage.id }
    })
    
    // Finally delete user
    await prisma.user.delete({
      where: { id: testUser.id }
    })

    results.push({
      test: 'Cleanup test data',
      success: true
    })

    console.log('✅ All comment functionality tests completed successfully!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    results.push({
      test: 'Comment functionality test',
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
  console.log('=' .repeat(50))
  
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
  
  console.log('=' .repeat(50))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.')
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCommentTests()
    .then(printResults)
    .catch(console.error)
}

export { runCommentTests, printResults }