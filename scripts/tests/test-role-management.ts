#!/usr/bin/env tsx

/**
 * Simple test script to verify role management functionality
 * Run with: npx tsx scripts/test-role-management.ts
 */

import { UserRole } from '@prisma/client'
import {
    isAdmin,
    canEditContent,
    canManageUsers,
    canAssignRole,
    getRoleLevel
} from '../../src/lib/auth-utils'

import {
    getAllRoles,
    getAssignableRoles,
    isRoleChangeAllowed,
    formatRole,
    sortRolesByHierarchy
} from '../../src/lib/role-utils'

console.log('🧪 Testing Role Management System\n')

// Test role hierarchy
console.log('📊 Role Hierarchy Tests:')
console.log(`MEMBER level: ${getRoleLevel(UserRole.MEMBER)}`)
console.log(`EDITOR level: ${getRoleLevel(UserRole.EDITOR)}`)
console.log(`ADMIN level: ${getRoleLevel(UserRole.ADMIN)}`)
console.log(`SYSTEM_ADMIN level: ${getRoleLevel(UserRole.SYSTEM_ADMIN)}`)

// Test role permissions
console.log('\n🔐 Permission Tests:')
const testRoles = [UserRole.MEMBER, UserRole.EDITOR, UserRole.ADMIN, UserRole.SYSTEM_ADMIN]

testRoles.forEach(role => {
    const mockSession = { user: { role }, expires: '' } as any
    console.log(`\n${formatRole(role)} permissions:`)
    console.log(`  - Can edit content: ${canEditContent(mockSession)}`)
    console.log(`  - Is admin: ${isAdmin(role)}`)
    console.log(`  - Can manage users: ${canManageUsers(mockSession)}`)
})

// Test role assignment permissions
console.log('\n👥 Role Assignment Tests:')
testRoles.forEach(currentRole => {
    console.log(`\n${formatRole(currentRole)} can assign:`)
    const assignableRoles = getAssignableRoles(currentRole)
    assignableRoles.forEach(assignableRole => {
        console.log(`  - ${assignableRole.label}`)
    })
    
    // Test individual role assignment permissions
    testRoles.forEach(targetRole => {
        const canAssign = canAssignRole(currentRole, targetRole)
        if (canAssign) {
            console.log(`  ✓ Can assign ${formatRole(targetRole)}`)
        }
    })
})

// Test role change validation
console.log('\n🔄 Role Change Validation Tests:')
const testCases = [
    { current: UserRole.ADMIN, target: UserRole.MEMBER, new: UserRole.EDITOR, expected: true },
    { current: UserRole.ADMIN, target: UserRole.EDITOR, new: UserRole.SYSTEM_ADMIN, expected: false },
    { current: UserRole.SYSTEM_ADMIN, target: UserRole.ADMIN, new: UserRole.MEMBER, expected: true },
    { current: UserRole.EDITOR, target: UserRole.MEMBER, new: UserRole.ADMIN, expected: false },
]

testCases.forEach(({ current, target, new: newRole, expected }, index) => {
    const result = isRoleChangeAllowed(current, target, newRole)
    const status = result === expected ? '✅' : '❌'
    console.log(`${status} Test ${index + 1}: ${formatRole(current)} changing ${formatRole(target)} to ${formatRole(newRole)} - Expected: ${expected}, Got: ${result}`)
})

// Test role definitions
console.log('\n📋 Role Definitions:')
getAllRoles().forEach(role => {
    console.log(`\n${role.label} (${role.value}):`)
    console.log(`  Description: ${role.description}`)
    console.log(`  Permissions: ${role.permissions.length} items`)
})

// Test role sorting
console.log('\n🔢 Role Sorting Test:')
const unsortedRoles = [UserRole.MEMBER, UserRole.SYSTEM_ADMIN, UserRole.EDITOR, UserRole.ADMIN]
const sortedRoles = sortRolesByHierarchy(unsortedRoles)
console.log('Original:', unsortedRoles.map(formatRole).join(', '))
console.log('Sorted:', sortedRoles.map(formatRole).join(', '))

console.log('\n✅ Role Management System Tests Completed!')