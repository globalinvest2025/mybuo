# Code Cleanup Plan

## 1. Update .gitignore File

Current status:
- The .gitignore file already has `*.local` on line 13, which would include `.env.local` files
- We should add an explicit entry for `.env.local` to make it clearer and more secure

Changes needed:
```diff
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local
+ .env.local

# Editor directories and files
```

## 2. Remove Console.log Statements

### DashboardPage.jsx

This file contains extensive debugging console.log statements that should be removed:

- Lines 66-69: Debug logs for upload start
- Lines 73-75: Debug logs for Supabase session
- Line 78: Debug log for missing user
- Lines 86-87: Debug logs for file path and extension
- Line 89: Debug log for upload attempt
- Lines 94-95: Debug logs for upload result
- Line 98: Debug log for upload failure
- Lines 103-104: Debug logs for public URL and upload end
- Lines 117-121: Debug logs for user session
- Line 124: Debug log for missing session
- Line 128: Debug log for authenticated user
- Lines 135-138: Debug logs for user changes
- Line 145: Debug log for loading businesses
- Line 148: Debug log for loaded businesses
- Lines 156-159: Debug logs for mutation start
- Line 162: Debug log for missing user in mutation
- Line 166: Debug log for uploading images
- Line 171: Debug log for image URLs
- Line 174: Debug log for data to insert
- Lines 177-178: Debug logs for insertion result
- Line 184: Debug log for successful business addition
- Line 190: Debug log for mutation error

### supabaseClient.js

The console.error statements in this file should be kept as they are for error handling, not debugging.

## Implementation Strategy

1. Switch to Code mode to make these changes
2. Update the .gitignore file to explicitly include .env.local
3. Remove all console.log statements from DashboardPage.jsx
4. Verify that the application still functions correctly