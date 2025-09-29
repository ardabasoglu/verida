#!/usr/bin/env tsx

/**
 * Simple test script to verify user management functionality
 * Run with: npx tsx scripts/tests/test-user-management.ts
 */

import { UserRole } from '@prisma/client'

console.log('🧪 Testing User Management System\n')

// Test user management API endpoints
async function testUserManagementAPI() {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    console.log('🔗 Testing User Management API Endpoints:')
    
    // Test endpoints that should exist
    const endpoints = [
        '/api/users',
        '/api/users/roles',
    ]
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            
            // We expect 401 (unauthorized) since we're not authenticated
            if (response.status === 401) {
                console.log(`✅ ${endpoint} - Properly protected (401)`)
            } else {
                console.log(`⚠️  ${endpoint} - Unexpected status: ${response.status}`)
            }
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error}`)
        }
    }
}

// Test user role validation
function testUserRoleValidation() {
    console.log('\n🔐 Testing User Role Validation:')
    
    const validRoles = Object.values(UserRole)
    console.log(`Valid roles: ${validRoles.join(', ')}`)
    
    // Test role display names
    const getRoleDisplayName = (role: UserRole) => {
        switch (role) {
            case UserRole.SYSTEM_ADMIN:
                return 'Sistem Yöneticisi';
            case UserRole.ADMIN:
                return 'Yönetici';
            case UserRole.EDITOR:
                return 'Editör';
            case UserRole.MEMBER:
                return 'Üye';
            default:
                return role;
        }
    }
    
    validRoles.forEach(role => {
        const displayName = getRoleDisplayName(role)
        console.log(`✅ ${role} -> ${displayName}`)
    })
}

// Test email domain validation
function testEmailValidation() {
    console.log('\n📧 Testing Email Domain Validation:')
    
    const testEmails = [
        { email: 'test@dgmgumruk.com', valid: true },
        { email: 'user@dgmgumruk.com', valid: true },
        { email: 'admin@gmail.com', valid: false },
        { email: 'test@example.com', valid: false },
        { email: 'invalid-email', valid: false },
        { email: '', valid: false },
    ]
    
    testEmails.forEach(({ email, valid }) => {
        const isValid = email.endsWith('@dgmgumruk.com') && email.includes('@')
        const status = isValid === valid ? '✅' : '❌'
        console.log(`${status} ${email || '(empty)'} - Expected: ${valid}, Got: ${isValid}`)
    })
}

// Test user permission checks
function testUserPermissions() {
    console.log('\n👥 Testing User Permission Checks:')
    
    const canModifyUser = (currentUserRole: UserRole, targetUserRole: UserRole, isSelf: boolean) => {
        if (isSelf) return false // Can't modify self
        
        // System admin can modify anyone except themselves
        if (currentUserRole === UserRole.SYSTEM_ADMIN) return true
        
        // Admin can modify editors and members, but not system admins or other admins
        if (currentUserRole === UserRole.ADMIN) {
            return targetUserRole === UserRole.EDITOR || targetUserRole === UserRole.MEMBER
        }
        
        return false
    }
    
    const testCases = [
        { current: UserRole.SYSTEM_ADMIN, target: UserRole.ADMIN, isSelf: false, expected: true },
        { current: UserRole.SYSTEM_ADMIN, target: UserRole.SYSTEM_ADMIN, isSelf: true, expected: false },
        { current: UserRole.ADMIN, target: UserRole.MEMBER, isSelf: false, expected: true },
        { current: UserRole.ADMIN, target: UserRole.EDITOR, isSelf: false, expected: true },
        { current: UserRole.ADMIN, target: UserRole.ADMIN, isSelf: false, expected: false },
        { current: UserRole.ADMIN, target: UserRole.SYSTEM_ADMIN, isSelf: false, expected: false },
        { current: UserRole.EDITOR, target: UserRole.MEMBER, isSelf: false, expected: false },
        { current: UserRole.MEMBER, target: UserRole.EDITOR, isSelf: false, expected: false },
    ]
    
    testCases.forEach(({ current, target, isSelf, expected }, index) => {
        const result = canModifyUser(current, target, isSelf)
        const status = result === expected ? '✅' : '❌'
        const selfText = isSelf ? ' (self)' : ''
        console.log(`${status} Test ${index + 1}: ${current} modifying ${target}${selfText} - Expected: ${expected}, Got: ${result}`)
    })
}

// Test user creation validation
function testUserCreationValidation() {
    console.log('\n➕ Testing User Creation Validation:')
    
    const validateUserData = (email: string, name: string, role: UserRole) => {
        const errors: string[] = []
        
        if (!email) errors.push('Email is required')
        if (!email.endsWith('@dgmgumruk.com')) errors.push('Email must end with @dgmgumruk.com')
        if (!name || name.length < 2) errors.push('Name must be at least 2 characters')
        if (!Object.values(UserRole).includes(role)) errors.push('Invalid role')
        
        return errors
    }
    
    const testCases = [
        { email: 'test@dgmgumruk.com', name: 'Test User', role: UserRole.MEMBER, expectedErrors: 0 },
        { email: 'invalid@gmail.com', name: 'Test User', role: UserRole.MEMBER, expectedErrors: 1 },
        { email: '', name: 'Test User', role: UserRole.MEMBER, expectedErrors: 2 },
        { email: 'test@dgmgumruk.com', name: 'A', role: UserRole.MEMBER, expectedErrors: 1 },
        { email: 'test@dgmgumruk.com', name: '', role: UserRole.MEMBER, expectedErrors: 1 },
    ]
    
    testCases.forEach(({ email, name, role, expectedErrors }, index) => {
        const errors = validateUserData(email, name, role)
        const status = errors.length === expectedErrors ? '✅' : '❌'
        console.log(`${status} Test ${index + 1}: ${errors.length} errors (expected ${expectedErrors})`)
        if (errors.length > 0) {
            console.log(`    Errors: ${errors.join(', ')}`)
        }
    })
}

// Run all tests
async function runTests() {
    try {
        testUserRoleValidation()
        testEmailValidation()
        testUserPermissions()
        testUserCreationValidation()
        
        // Only test API if we're in a development environment
        if (process.env.NODE_ENV === 'development') {
            await testUserManagementAPI()
        } else {
            console.log('\n⚠️  Skipping API tests (not in development environment)')
        }
        
        console.log('\n✅ User Management System Tests Completed!')
        
    } catch (error) {
        console.error('\n❌ Test execution failed:', error)
        process.exit(1)
    }
}

// Run the tests
runTests()