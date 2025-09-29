# Social Memes ($MEMES)

A social platform for sharing memes with token tagging functionality, built with Next.js and Supabase.

## Features

- 🖼️ **Image-only meme posting** - Share your favorite memes
- 🪙 **Token tagging** - Tag tokens with automatic DexScreener integration
- 👥 **User profiles** - Create accounts with usernames and bios
- 🔄 **Follow system** - Follow other users to see their posts in your feed
- ❤️ **Like system** - Like posts you enjoy
- 📱 **Modern UI** - Clean, Twitter-like interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **UI Components**: Custom components with Radix UI primitives
- **Deployment**: Vercel (recommended)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd social-memes
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` and run it
4. Go to Storage and create a new bucket called `memes` with public access

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with username, bio, avatar
- **posts** - Meme posts with images and token information
- **follows** - User follow relationships
- **likes** - Post likes

## Key Features Implementation

### Token Integration

When users tag a token with a contract address, the app automatically generates a DexScreener URL for easy token analysis.

### Feed Algorithm

The feed shows:
1. Posts from users you follow
2. Recent posts from all users (discovery)
3. Posts are ordered by creation time (newest first)

### Image Storage

Images are stored in Supabase Storage with automatic public URL generation.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.