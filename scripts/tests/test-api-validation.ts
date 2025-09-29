#!/usr/bin/env tsx

/**
 * Test API validation schemas
 * Run with: npx tsx scripts/test-api-validation.ts
 */

import { UserRole } from '@prisma/client'
import { 
  createUserSchema, 
  updateUserSchema, 
  updateUserRoleSchema, 
  userSearchSchema,
  userIdSchema
} from '../../src/lib/validations/user'

console.log('🧪 Testing API Validation Schemas\n')

// Test createUserSchema
console.log('📝 Testing createUserSchema:')

const validUserData = {
  email: 'test@dgmgumruk.com',
  name: 'Test User',
  role: UserRole.MEMBER
}

try {
  const result = createUserSchema.parse(validUserData)
  console.log('✅ Valid user data passed:', result)
} catch (error) {
  console.log('❌ Valid user data failed:', error)
}

const invalidUserData = {
  email: 'test@gmail.com', // Wrong domain
  name: 'T', // Too short
  role: 'INVALID_ROLE'
}

try {
  createUserSchema.parse(invalidUserData)
  console.log('❌ Invalid user data should have failed')
} catch (error) {
  console.log('✅ Invalid user data correctly rejected')
}

// Test updateUserSchema
console.log('\n🔄 Testing updateUserSchema:')

const validUpdateData = {
  name: 'Updated Name',
  role: UserRole.EDITOR
}

try {
  const result = updateUserSchema.parse(validUpdateData)
  console.log('✅ Valid update data passed:', result)
} catch (error) {
  console.log('❌ Valid update data failed:', error)
}

// Test updateUserRoleSchema
console.log('\n👤 Testing updateUserRoleSchema:')

const validRoleData = {
  role: UserRole.ADMIN
}

try {
  const result = updateUserRoleSchema.parse(validRoleData)
  console.log('✅ Valid role data passed:', result)
} catch (error) {
  console.log('❌ Valid role data failed:', error)
}

const invalidRoleData = {
  role: 'INVALID_ROLE'
}

try {
  updateUserRoleSchema.parse(invalidRoleData)
  console.log('❌ Invalid role data should have failed')
} catch (error) {
  console.log('✅ Invalid role data correctly rejected')
}

// Test userSearchSchema
console.log('\n🔍 Testing userSearchSchema:')

const validSearchData = {
  search: 'test',
  role: UserRole.MEMBER,
  page: '1',
  limit: '10'
}

try {
  const result = userSearchSchema.parse(validSearchData)
  console.log('✅ Valid search data passed:', result)
} catch (error) {
  console.log('❌ Valid search data failed:', error)
}

// Test userIdSchema
console.log('\n🆔 Testing userIdSchema:')

const validIdData = {
  id: 'clx1234567890abcdef'
}

try {
  const result = userIdSchema.parse(validIdData)
  console.log('✅ Valid ID data passed:', result)
} catch (error) {
  console.log('❌ Valid ID data failed:', error)
}

const invalidIdData = {
  id: 'invalid-id'
}

try {
  userIdSchema.parse(invalidIdData)
  console.log('❌ Invalid ID data should have failed')
} catch (error) {
  console.log('✅ Invalid ID data correctly rejected')
}

console.log('\n✅ API Validation Tests Completed!')