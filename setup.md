# Setup Instructions for Social Memes

## Quick Start Guide

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Click "Run" to execute the schema

3. **Set up Storage**:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `memes`
   - Set it to public access
   - Configure RLS policies if needed

4. **Configure Authentication**:
   - Go to Authentication > Settings
   - Enable email authentication
   - Configure your site URL (e.g., `http://localhost:3000` for development)

### 3. Run the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see your social memes platform!

## Features Implemented

✅ **User Authentication** - Sign up/sign in with email
✅ **User Profiles** - Username, bio, avatar support
✅ **Meme Posting** - Image upload with optional captions
✅ **Token Tagging** - Tag tokens with automatic DexScreener links
✅ **Follow System** - Follow/unfollow other users
✅ **Feed Algorithm** - Personalized feed with followed users
✅ **Like System** - Like posts
✅ **Modern UI** - Clean, responsive design
✅ **Real-time Updates** - Supabase real-time subscriptions

## Next Steps

1. **Deploy to Vercel**:
   - Push your code to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy!

2. **Customize**:
   - Update branding and colors
   - Add more token integrations
   - Implement advanced feed algorithms
   - Add notifications

3. **Scale**:
   - Set up proper image optimization
   - Add caching strategies
   - Implement advanced search
   - Add analytics

## Database Tables Created

- `profiles` - User profiles with usernames and bios
- `posts` - Meme posts with images and token data
- `follows` - User follow relationships
- `likes` - Post likes
- `storage.buckets` - Image storage for memes

The platform is now ready to use! Users can create accounts, share memes, tag tokens, and follow each other.
