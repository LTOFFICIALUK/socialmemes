# Admin Access Control System

This document describes the admin access control system implemented to secure the `/admin` page and related admin functionality.

## Overview

The admin access control system uses a dedicated `admins` table in the database to manage which users have admin privileges. This is more secure than relying on the `pro` status in the profiles table.

## Database Schema

### `admins` Table

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);
```

### Key Features

- **Row Level Security (RLS)**: Only admins can view/modify the admins table
- **Audit Trail**: Tracks who created each admin entry
- **Flexible Permissions**: JSONB field for storing specific permissions
- **Soft Delete**: Uses `is_active` flag instead of hard deletion
- **Database Function**: `is_admin(user_uuid)` function for easy admin checks

## API Endpoints

### 1. Check Admin Access
- **Endpoint**: `GET /api/admin/check-access`
- **Purpose**: Verify if the current user has admin privileges
- **Authentication**: Requires Bearer token
- **Response**: `{ success: boolean, isAdmin: boolean, userId: string }`

### 2. Manage Admin Users
- **Endpoint**: `GET /api/admin/manage`
- **Purpose**: List all admin users (admin only)
- **Authentication**: Requires Bearer token + admin privileges

- **Endpoint**: `POST /api/admin/manage`
- **Purpose**: Add or remove admin users (admin only)
- **Body**: `{ action: "add" | "remove", userId: string, permissions?: object }`

## Frontend Implementation

### Admin Dashboard Protection

The admin dashboard (`/admin`) now includes proper access control:

1. **Authentication Check**: Verifies user is logged in
2. **Admin Check**: Calls the admin access API to verify privileges
3. **Redirect**: Non-admin users are redirected to home page
4. **Loading State**: Shows loading while checking permissions

### Middleware Protection

The middleware now:
- Redirects unauthenticated users to sign-in for admin routes
- Allows client-side components to handle detailed admin checks

## Setup Instructions

### 1. Run Database Migration

Execute the migration file to create the admins table:

```bash
# Run this in your Supabase SQL editor or via psql
psql -f migration-create-admins-table.sql
```

### 2. Add First Admin User

Use the provided script to add your first admin user:

```sql
-- First, find your user ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Then add yourself as admin (replace YOUR_USER_ID_HERE)
INSERT INTO admins (user_id, created_by, is_active, permissions) 
VALUES ('YOUR_USER_ID_HERE', 'YOUR_USER_ID_HERE', true, '{"role": "super_admin"}'::jsonb);
```

### 3. Test Admin Access

Verify the setup works:

```sql
-- Test the admin function
SELECT is_admin('YOUR_USER_ID_HERE');

-- Check admin records
SELECT a.*, p.username, p.email 
FROM admins a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.is_active = true;
```

## Security Features

### 1. Row Level Security (RLS)
- Only admins can view the admins table
- Only admins can add/remove other admins
- Prevents unauthorized access at the database level

### 2. JWT Token Validation
- All admin API endpoints validate JWT tokens
- Tokens are checked for validity and expiration
- Proper error handling for invalid tokens

### 3. Double Authentication
- User must be authenticated (logged in)
- User must have admin privileges in the database
- Both checks must pass for admin access

### 4. Audit Trail
- Tracks who created each admin entry
- Timestamps for all admin actions
- Soft delete preserves history

## Usage Examples

### Check if User is Admin (Frontend)

```typescript
import { isUserAdmin } from '@/lib/admin-utils'

const checkAdmin = async () => {
  const isAdmin = await isUserAdmin()
  if (isAdmin) {
    // User has admin access
  }
}
```

### Add Admin User (Backend)

```typescript
import { addAdminUser } from '@/lib/admin-utils'

const makeUserAdmin = async (userId: string) => {
  const success = await addAdminUser(userId, { role: 'admin' })
  if (success) {
    console.log('User added as admin')
  }
}
```

### API Call to Check Admin Status

```typescript
const checkAdminAccess = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch('/api/admin/check-access', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  })
  
  const result = await response.json()
  return result.isAdmin
}
```

## Migration from Pro-Based Access

The system has been updated to use the new admin table instead of checking the `pro` field in profiles. The old check:

```typescript
// OLD (insecure)
if (!profile?.pro) {
  router.push('/')
  return
}
```

Has been replaced with:

```typescript
// NEW (secure)
const adminCheck = await fetch('/api/admin/check-access', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})

if (!adminCheck.success || !adminCheck.isAdmin) {
  router.push('/')
  return
}
```

## Troubleshooting

### Common Issues

1. **"Access denied" errors**: Ensure the user is in the admins table with `is_active = true`
2. **JWT token errors**: Check that the user is properly authenticated
3. **Database function errors**: Verify the `is_admin` function was created correctly

### Debug Queries

```sql
-- Check if user exists in admins table
SELECT * FROM admins WHERE user_id = 'USER_ID_HERE';

-- Test the admin function
SELECT is_admin('USER_ID_HERE');

-- Check all active admins
SELECT a.*, p.username 
FROM admins a 
LEFT JOIN profiles p ON a.user_id = p.id 
WHERE a.is_active = true;
```

## Future Enhancements

1. **Role-based permissions**: Use the permissions JSONB field for granular access control
2. **Admin activity logging**: Track admin actions for audit purposes
3. **Temporary admin access**: Add expiration dates for admin privileges
4. **Admin invitation system**: Allow admins to invite new admins via email
