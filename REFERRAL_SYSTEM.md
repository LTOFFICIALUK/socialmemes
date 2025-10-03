# Referral System Implementation

This document outlines the complete referral system implementation for Social Memes.

## Overview

The referral system allows users to invite friends to join Social Memes by sharing their unique referral code or link. When someone signs up using a referral code, they are linked to the referrer's account.

## Database Changes

### New Columns in `profiles` Table

- `referral_code` (TEXT, UNIQUE): Username-based referral code (uppercase)
- `referral_link` (TEXT): Full URL for sharing referrals
- `referred_by` (UUID): References the user who referred this user

### New Functions

- `generate_referral_code(username)`: Creates referral code from username (uppercase)
- `generate_referral_link(user_id)`: Generates referral links
- `get_referrer_by_code(referral_code)`: Looks up referrer by code
- `get_referral_stats(user_id)`: Returns referral statistics
- `get_user_referrals(user_id, limit, offset)`: Returns list of referrals

### Updated Functions

- `handle_new_user()`: Now handles referral logic during signup

## Frontend Changes

### Signup Page (`/auth/signup`)

- Added optional referral code input field
- Validates referral codes in real-time
- Pre-fills referral code from URL parameter (`?ref=CODE`)
- Converts input to uppercase automatically

### Referrals Page (`/referrals`)

- Displays user's referral code and link
- Shows referral statistics (total and recent)
- Lists recent referrals with user details
- Copy-to-clipboard functionality for code and link
- Native sharing support on mobile devices
- Responsive design for all screen sizes

### Navigation Updates

- Added "Referrals" to desktop sidebar navigation
- Added "Referrals" to mobile dropdown menu (three-dot menu)

## How It Works

### For Referrers

1. Users can access their referral page via navigation menu
2. They can copy their referral code or link
3. They can share via native sharing or copy to clipboard
4. They can track their referral statistics and see who they've referred

### For New Users

1. When signing up, they can enter a referral code (optional)
2. The system validates the referral code exists
3. If valid, the new user is linked to the referrer
4. The referrer can see the new user in their referrals list

### URL Structure

- Referral links: `https://socialmemes.app/auth/signup?ref=USERNAME`
- Referrals page: `https://socialmemes.app/referrals`

## Implementation Details

### Database Migration

Run the migration file to add referral functionality:

```sql
-- Run this in your Supabase SQL editor
\i migration-add-referral-system.sql
```

### Code Generation

Referral codes are based on the user's username, converted to uppercase for consistency. This makes them more memorable and user-friendly.

### Security

- Row Level Security (RLS) policies protect referral data
- Users can only view their own referral statistics
- Referral codes are publicly viewable (needed for validation)

### Performance

- Indexes on `referral_code` and `referred_by` for fast lookups
- Efficient queries for statistics and referral lists
- Pagination support for large referral lists

## Testing

Use the test script to verify the implementation:

```sql
-- Run this in your Supabase SQL editor
\i test_referral_system.sql
```

## Future Enhancements

Potential improvements for the referral system:

1. **Rewards System**: Give referrers benefits for successful referrals
2. **Analytics**: Track referral conversion rates and sources
3. **Custom Codes**: Allow users to set custom referral codes
4. **Referral Tiers**: Different benefits based on referral count
5. **Social Sharing**: Enhanced sharing with preview cards
6. **Email Integration**: Send referral invitations via email

## Troubleshooting

### Common Issues

1. **Referral code not found**: Ensure the code exists and is uppercase
2. **Migration errors**: Check that all functions are created successfully
3. **RLS issues**: Verify policies are in place for referral data access

### Debug Queries

```sql
-- Check if a referral code exists
SELECT * FROM profiles WHERE referral_code = 'USERNAME';

-- Check referral statistics for a user
SELECT * FROM get_referral_stats('user-id-here');

-- Check recent referrals
SELECT * FROM get_user_referrals('user-id-here', 10, 0);
```

## Files Modified/Created

### New Files
- `migration-add-referral-system.sql` - Database migration
- `src/app/referrals/page.tsx` - Referrals page server component
- `src/app/referrals/referrals-client.tsx` - Referrals page client component
- `test_referral_system.sql` - Test script
- `REFERRAL_SYSTEM.md` - This documentation

### Modified Files
- `src/app/auth/signup/page.tsx` - Added referral code field
- `src/components/navigation.tsx` - Added referrals to desktop nav
- `src/components/mobile-menu-button.tsx` - Added referrals to mobile menu

## Deployment Checklist

1. ✅ Run database migration
2. ✅ Deploy frontend changes
3. ✅ Test referral code generation
4. ✅ Test signup with referral code
5. ✅ Test referrals page functionality
6. ✅ Verify navigation links work
7. ✅ Test mobile responsiveness
8. ✅ Verify RLS policies work correctly
