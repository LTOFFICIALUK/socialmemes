# GitHub Actions Setup for Auto-Unflagging

This document explains how to set up GitHub Actions to automatically unflag users after 24 hours.

## 🚀 Quick Setup

### 1. Add Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (starts with `eyJ...`)
- `CRON_SECRET`: A random secret string for API authentication (optional but recommended)

### 2. Choose Your Workflow

You have two options:

#### Option A: Direct Database Access (Recommended)
- **File**: `.github/workflows/unflag-users-direct.yml`
- **How it works**: Directly calls the database function
- **Pros**: More reliable, faster, no API dependency
- **Cons**: Requires Supabase service key in GitHub secrets

#### Option B: API Endpoint
- **File**: `.github/workflows/unflag-users.yml`
- **How it works**: Calls your API endpoint
- **Pros**: Uses your existing API logic
- **Cons**: Depends on your app being deployed and accessible

### 3. Enable the Workflow

1. Commit and push the workflow file to your repository
2. Go to Actions tab in GitHub
3. You should see the workflow listed
4. It will run automatically every hour

## 🧪 Testing

### Manual Testing

Run the unflag script locally:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Run the script
npm run unflag
```

### Manual Workflow Trigger

1. Go to GitHub Actions tab
2. Click on "Auto Unflag Users" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"

## 📊 Monitoring

### Check Workflow Runs

1. Go to Actions tab in GitHub
2. Click on the workflow
3. View logs to see how many users were unflagged

### Check Database

Run this SQL in Supabase to see current flagged users:

```sql
SELECT 
  id,
  username,
  moderation_status,
  moderation_reason,
  moderated_at,
  (NOW() - moderated_at) as time_since_flag,
  CASE 
    WHEN moderated_at < (NOW() - INTERVAL '24 hours') THEN 'EXPIRED'
    ELSE CONCAT('Active for ', EXTRACT(EPOCH FROM (NOW() - moderated_at))/3600, ' more hours')
  END as flag_status
FROM public.profiles
WHERE moderation_status = 'flagged'
ORDER BY moderated_at DESC;
```

## 🔧 Troubleshooting

### Workflow Not Running

1. Check if the workflow file is in `.github/workflows/` directory
2. Ensure the file has `.yml` extension
3. Check the cron syntax: `'0 * * * *'` (every hour at minute 0)

### Permission Errors

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Ensure the service key has admin privileges
3. Check that RLS policies allow the service key to update profiles

### No Users Being Unflagged

1. Check if there are actually expired flags in the database
2. Verify the 24-hour calculation is correct
3. Check workflow logs for error messages

## 🛡️ Security Notes

- The service role key has full database access - keep it secure
- Consider using a dedicated service account for this task
- Monitor the workflow runs for any suspicious activity
- The `CRON_SECRET` adds an extra layer of security to API calls

## 📝 Customization

### Change Schedule

Edit the cron expression in the workflow file:

```yaml
schedule:
  - cron: '0 */2 * * *'  # Every 2 hours
  - cron: '0 0 * * *'    # Daily at midnight
  - cron: '0 0 * * 0'    # Weekly on Sunday
```

### Add Notifications

Add Slack/Discord notifications when users are unflagged:

```yaml
- name: Notify on unflag
  if: success()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Unflagged X users"}' \
      $SLACK_WEBHOOK_URL
```

## 🎯 How It Works

1. **Every hour**, GitHub Actions runs the workflow
2. **Checks database** for users flagged more than 24 hours ago
3. **Updates profiles** to set `moderation_status = 'active'`
4. **Logs results** showing how many users were unflagged
5. **Client-side checks** also automatically unflag users when they try to perform actions

This creates a robust system with multiple layers of protection to ensure users are unflagged after exactly 24 hours.
