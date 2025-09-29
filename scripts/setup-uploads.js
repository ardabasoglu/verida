#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  console.log(`✅ Created uploads directory: ${UPLOAD_DIR}`)
} else {
  console.log(`✅ Uploads directory already exists: ${UPLOAD_DIR}`)
}

// Create .gitkeep file to ensure directory is tracked in git
const gitkeepPath = path.join(UPLOAD_DIR, '.gitkeep')
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '')
  console.log(`✅ Created .gitkeep file in uploads directory`)
}

// Create .gitignore to ignore uploaded files but keep the directory
const gitignorePath = path.join(UPLOAD_DIR, '.gitignore')
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, `# Ignore all files in uploads directory except .gitkeep
*
!.gitkeep
!.gitignore
`)
  console.log(`✅ Created .gitignore file in uploads directory`)
}

console.log('🎉 Upload directory setup complete!')