# GitHub Secrets Setup for Payout Orchestration

To set up the GitHub Action for bi-weekly payout orchestration, you need to configure the following secrets in your GitHub repository:

## Required Secrets

### 1. `APP_URL`
- **Description:** Your deployed application URL
- **Example:** `https://your-app.vercel.app` or `https://your-domain.com`
- **How to set:** Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### 2. `API_SECRET_KEY`
- **Description:** A secret key to authenticate API calls to your orchestrator
- **Example:** Generate a random string like `sk_live_1234567890abcdef`
- **How to set:** Same as above

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value

## Alternative: Environment Variables

If you prefer to use environment variables instead of secrets, you can modify the workflow to use:

```yaml
env:
  APP_URL: ${{ vars.APP_URL }}
  API_SECRET_KEY: ${{ vars.API_SECRET_KEY }}
```

And set them as repository variables instead of secrets.

## Security Note

- Keep your `API_SECRET_KEY` secure and don't share it
- Consider implementing API key validation in your orchestrator endpoint
- The secret key should be different from your production database keys

## Testing

You can test the workflow by:
1. Going to **Actions** tab in your GitHub repo
2. Finding the "Bi-weekly Payout Orchestration" workflow
3. Clicking **Run workflow** to trigger it manually

## Schedule

The workflow is set to run:
- **1st of every month at 2:00 AM UTC** (for periods 1st-14th)
- **15th of every month at 2:00 AM UTC** (for periods 15th-end of month)

This aligns with your biweekly periods structure.
