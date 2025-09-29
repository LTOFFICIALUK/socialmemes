'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  MessageSquare, 
  Bell, 
  Search,
  Settings,
  HelpCircle,
  Code,
  Zap,
  Shield,
  Heart,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children?: DocSection[]
  content?: React.ReactNode
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    children: [
      {
        id: 'introduction',
        title: 'Introduction',
        icon: BookOpen,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Welcome to Social Memes</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Social Memes is a modern social media platform built for sharing and discovering memes, 
              with a focus on community engagement and real-time interactions.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Like and share memes with your community</span>
              </li>
              <li className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>Real-time comments and replies</span>
              </li>
              <li className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <span>Instant notifications for interactions</span>
              </li>
              <li className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Advanced search and discovery</span>
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
            <p className="text-gray-300 mb-4">To get started with Social Memes:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4">
              <li>Create an account or sign in</li>
              <li>Set up your profile with a username and avatar</li>
              <li>Start exploring memes on the home feed</li>
              <li>Like, comment, and share content you enjoy</li>
              <li>Follow other users to build your network</li>
            </ol>
          </div>
        )
      },
      {
        id: 'account-setup',
        title: 'Account Setup',
        icon: Users,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Account Setup</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Setting up your Social Memes account is quick and easy. Follow these steps to get started.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Creating Your Account</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Sign Up Process</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Click the &quot;Sign Up&quot; button in the navigation</li>
              <li>Enter your email address and create a secure password</li>
              <li>Choose a unique username (this will be your profile handle)</li>
              <li>Verify your email address</li>
              <li>Complete your profile setup</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Profile Customization</h2>
            <p className="text-gray-300 mb-4">After creating your account, you can customize your profile:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Upload a profile picture or avatar</li>
              <li>Add a bio to tell others about yourself</li>
              <li>Set your display preferences</li>
              <li>Configure notification settings</li>
            </ul>

            <div className="bg-black border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300">
                <strong>Tip:</strong> Choose a memorable username as it will be your unique identifier on the platform.
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'features',
    title: 'Features',
    icon: Code,
    children: [
      {
        id: 'posting-memes',
        title: 'Posting Memes',
        icon: MessageSquare,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Posting Memes</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Learn how to create and share memes on Social Memes platform.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Creating a Post</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Step-by-Step Guide</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Click the &quot;Create Post&quot; button (usually a + icon)</li>
              <li>Upload an image or select from your device</li>
              <li>Add a caption or description</li>
              <li>Add relevant hashtags for discoverability</li>
              <li>Choose your privacy settings</li>
              <li>Click &quot;Post&quot; to share with the community</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Use high-quality images for better engagement</li>
              <li>Write engaging captions that add context</li>
              <li>Use relevant hashtags to reach more people</li>
              <li>Be respectful and follow community guidelines</li>
              <li>Credit original creators when possible</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Image Guidelines</h2>
            <h3 className="text-xl font-semibold text-yellow-300 mb-4">Supported Formats</h3>
            <ul className="text-yellow-200 space-y-2 ml-4">
              <li>• JPEG, PNG, GIF formats</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Recommended resolution: 1080x1080 or higher</li>
            </ul>
          </div>
        )
      },
      {
        id: 'interactions',
        title: 'Interactions',
        icon: Heart,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Interactions</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Engage with the community through likes, comments, and shares.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Liking Content</h2>
            <p className="text-gray-300 mb-4">Show appreciation for memes you enjoy:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Click the heart icon to like a post</li>
              <li>Liked posts appear in your activity</li>
              <li>Authors receive notifications for likes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Comments and Replies</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Commenting System</h3>
            <ul className="space-y-3 text-gray-300 ml-4 mb-8">
              <li>• Click &quot;Comment&quot; to add your thoughts</li>
              <li>• Reply to specific comments for threaded discussions</li>
              <li>• Use @mentions to tag other users</li>
              <li>• Edit or delete your own comments</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Following Users</h2>
            <p className="text-gray-300 mb-4">Build your network by following interesting creators:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4">
              <li>Visit a user&apos;s profile</li>
              <li>Click the &quot;Follow&quot; button</li>
              <li>Their posts will appear in your feed</li>
              <li>Manage your following list in your profile</li>
            </ol>
          </div>
        )
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: Bell,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Notifications</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Stay updated with real-time notifications about your activity and interactions.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Notification Types</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Activity Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-6">
              <li>• New likes on your posts</li>
              <li>• Comments on your content</li>
              <li>• New followers</li>
              <li>• Mentions in comments</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-4">System Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-8">
              <li>• Account updates</li>
              <li>• Platform announcements</li>
              <li>• Security alerts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Managing Notifications</h2>
            <p className="text-gray-300 mb-4">Customize your notification preferences:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Go to your profile settings</li>
              <li>Navigate to &quot;Notifications&quot;</li>
              <li>Toggle specific notification types on/off</li>
              <li>Set quiet hours for notifications</li>
              <li>Choose email notification preferences</li>
            </ol>

            <div className="bg-black border border-green-600 rounded-lg p-4">
              <p className="text-green-300">
                <strong>Pro Tip:</strong> Enable push notifications to never miss important interactions with your content.
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    icon: Search,
    children: [
      {
        id: 'search-basics',
        title: 'Search Basics',
        icon: Search,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Search & Discovery</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Find the content and people you&apos;re looking for with our powerful search features.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Searching Content</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Search Options</h3>
            <ul className="space-y-3 text-gray-300 ml-4 mb-8">
              <li>• <strong>Text Search:</strong> Search by captions, descriptions, and comments</li>
              <li>• <strong>Hashtag Search:</strong> Find content by specific hashtags</li>
              <li>• <strong>User Search:</strong> Find other users by username</li>
              <li>• <strong>Trending:</strong> Discover popular content and hashtags</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Search Tips</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Use specific keywords for better results</li>
              <li>Try different variations of your search terms</li>
              <li>Use hashtags to find themed content</li>
              <li>Check trending topics for popular discussions</li>
              <li>Save searches for quick access later</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Discovery Features</h2>
            <h3 className="text-xl font-semibold text-blue-300 mb-4">Explore Page</h3>
            <p className="text-blue-200 mb-6">Discover trending memes and popular content from across the platform.</p>
            
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Recommendations</h3>
            <p className="text-purple-200">Get personalized content suggestions based on your interests and activity.</p>
          </div>
        )
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Privacy',
    icon: Settings,
    children: [
      {
        id: 'privacy-settings',
        title: 'Privacy Settings',
        icon: Shield,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Privacy Settings</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Control your privacy and manage how others can interact with your content.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Profile Privacy</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Privacy Options</h3>
            <ul className="space-y-3 text-gray-300 ml-4 mb-8">
              <li>• <strong>Public Profile:</strong> Anyone can view your posts and profile</li>
              <li>• <strong>Private Profile:</strong> Only approved followers can see your content</li>
              <li>• <strong>Custom:</strong> Set specific privacy rules for different content types</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Content Controls</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Control who can comment on your posts</li>
              <li>Block or mute specific users</li>
              <li>Set content filters for your feed</li>
              <li>Manage who can tag you in posts</li>
              <li>Control data sharing preferences</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Account Security</h2>
            <h3 className="text-xl font-semibold text-red-300 mb-4">Security Features</h3>
            <ul className="text-red-200 space-y-2 ml-4">
              <li>• Two-factor authentication</li>
              <li>• Login activity monitoring</li>
              <li>• Password strength requirements</li>
              <li>• Suspicious activity alerts</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    children: [
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        icon: HelpCircle,
        content: (
          <div className="prose prose-invert max-w-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Frequently Asked Questions</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Find answers to common questions about using Social Memes.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">How do I delete my account?</h3>
                <p className="text-gray-300">
                  Go to Settings → Account → Delete Account. This action is permanent and cannot be undone.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Can I change my username?</h3>
                <p className="text-gray-300">
                  Yes, you can change your username in Settings → Profile. Keep in mind this will update your profile URL.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">How do I report inappropriate content?</h3>
                <p className="text-gray-300">
                  Click the three dots menu on any post and select &quot;Report&quot;. Our moderation team will review the content.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Why can&apos;t I see certain posts?</h3>
                <p className="text-gray-300">
                  This could be due to privacy settings, content filters, or the user may have blocked you.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8">Still Need Help?</h2>
            <p className="text-blue-300 mb-4">
              If you can&apos;t find the answer you&apos;re looking for, we&apos;re here to help:
            </p>
            <ul className="text-blue-200 space-y-2 ml-4">
              <li>• Contact our support team at support@socialmemes.com</li>
              <li>• Join our community Discord server</li>
              <li>• Check our status page for service updates</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'platform-whitepaper',
    title: 'Platform Whitepaper',
    icon: BookOpen,
    content: (
      <div className="prose prose-invert max-w-none">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Social Memes – Platform Whitepaper</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          Social Memes is a crypto-enabled social media platform designed around the intersection of memes and token communities. 
          Users can share memes or post text updates, attach Solana tokens to their content, and see which tokens are gaining traction across the platform.
        </p>
        <p className="text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          The platform combines familiar social features — feeds, profiles, search, and notifications — with token-aware functionality unique to Solana&apos;s ecosystem.
        </p>

        <h2 className="text-2xl font-semibold text-white mb-4">2. Platform Structure</h2>
        
        <h3 className="text-xl font-semibold text-white mb-4">2.1 Home / Feed</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Displays posts from followed accounts and trending community content</li>
          <li>• Supports both meme posts (images) and text-only posts</li>
          <li>• Token-linked posts display attached token information</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.2 Explore</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• A grid-based layout showcasing the most recent shared memes/images</li>
          <li>• Purely chronological display, optimized for browsing visual content</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.3 Search</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Search for posts, users, and tokens</li>
          <li>• Tabs: Popular, Latest, and Users</li>
          <li>• Token-aware search enables discovery of memes or discussions tied to specific Solana tokens</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.4 Notifications</h3>
        <p className="text-gray-300 mb-4">Alerts for:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• New likes</li>
          <li>• New replies</li>
          <li>• New followers</li>
          <li>• No notifications for shares or token activity</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.5 Profile Pages</h3>
        <p className="text-gray-300 mb-4">Public profile includes:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Banner image</li>
          <li>• Profile picture, display name, and permanent username (set at signup and cannot be changed)</li>
          <li>• Bio and stats (posts, followers, following)</li>
          <li>• User&apos;s shared memes and text posts</li>
          <li>• Editable sections: banner, profile picture, and bio</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.6 Post Pages</h3>
        <p className="text-gray-300 mb-4">Dedicated view for each individual post. Displays:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Meme (image + optional caption) or text-only post</li>
          <li>• Attached Solana token details</li>
          <li>• Engagement metrics (likes, replies)</li>
          <li>• Discussion thread with replies</li>
          <li>• Shareable via external link</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">3. Content & Interaction</h2>
        
        <h3 className="text-xl font-semibold text-white mb-4">3.1 Posts</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Meme Sharing:</strong> users upload memes/images created outside the platform</li>
          <li>• <strong>Text Posts:</strong> users can publish text-only updates</li>
          <li>• <strong>Token Attachments:</strong> posts can include an attached Solana token for visibility and context</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">3.2 Engagement</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Likes</strong> – basic feedback mechanism</li>
          <li>• <strong>Replies</strong> – threaded discussions under posts</li>
          <li>• <strong>Shares</strong> – external link sharing</li>
          <li>• <strong>Follows</strong> – connect with creators and communities</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">4. Token Integration</h2>
        
        <h3 className="text-xl font-semibold text-white mb-4">4.1 Token Attachments</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Posts can optionally include a Solana token</li>
          <li>• Establishes a link between memes/discussions and token communities</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">4.2 Trending Tokens</h3>
        <p className="text-gray-300 mb-4">Right-hand column displays a Top 10 tokens list. Ranked by:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Post volume</li>
          <li>• Engagement (likes and replies)</li>
          <li>• Updates dynamically to reflect platform-wide activity</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">5. Technical Foundation</h2>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Frontend</strong> – responsive web interface optimized for both desktop and mobile</li>
          <li>• <strong>Backend</strong> – scalable API infrastructure for handling user data, content, and engagement</li>
          <li>• <strong>Storage</strong> – centralized media storage at launch, with future options for decentralized hosting</li>
          <li>• <strong>Blockchain Integration</strong> – built natively on Solana, using its token ecosystem for post attachments and trending token tracking</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">6. Summary</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Social Memes is a Solana-native social platform where users share memes and text posts, engage with each other, and connect their content to tokens.
        </p>
        <p className="text-gray-300 mb-4">The platform includes:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• A familiar feed-based structure</li>
          <li>• Grid-style meme discovery via Explore</li>
          <li>• Profile pages with permanent usernames and customizable banners</li>
          <li>• Post pages supporting both memes and text posts, with optional token attachments</li>
          <li>• A real-time list of trending Solana tokens ranked by post activity and engagement</li>
        </ul>
        <p className="text-gray-300 leading-relaxed">
          By combining proven social features with token integration, Social Memes provides a straightforward but crypto-native experience tailored to meme culture and Solana communities.
        </p>
      </div>
    )
  },
  {
    id: 'product-roadmap',
    title: 'Product Roadmap',
    icon: Code,
    content: (
      <div className="prose prose-invert max-w-none">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Social Memes – Product Roadmap</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">Guiding Principle</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          Social Memes is designed to remain clean, simple, and user-first.
        </p>
        <p className="text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          The roadmap introduces only the core utilities needed for growth and sustainability, while avoiding unnecessary clutter. Future developments will be shaped by community feedback and organic evolution.
        </p>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 1 – Core Platform (Live)</h2>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Meme/image sharing (upload only, no in-app creation)</li>
          <li>• Text-only posts</li>
          <li>• Solana token attachments to posts</li>
          <li>• Feed, Explore (grid of most recent memes/images), Search, Profiles, Notifications</li>
          <li>• Trending Tokens list (Top 10 by activity)</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 2 – Monetization & Rewards (Near-Term)</h2>
        
        <h3 className="text-xl font-semibold text-white mb-4">Creator Rewards Program</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Weekly SOL payouts to active creators</li>
          <li>• Based on engagement, token activity, and community growth</li>
          <li>• Rewards sent directly to linked Solana wallets</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">Paid Advertising</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Promoted Posts</strong> → boosted visibility in feed and Explore</li>
          <li>• <strong>Promoted Tokens</strong> → sponsored slots in the Trending Tokens panel (clearly marked as promoted)</li>
          <li>• Ad revenue helps fund Creator Rewards and platform sustainability</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">User Subscriptions (&quot;Verification&quot;)</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Users can subscribe to the platform for verified status</li>
          <li>• Verified users receive a badge on their profile and improved visibility</li>
          <li>• Establishes recurring revenue for the platform</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 3 – Community-Guided Evolution (Future)</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Future features will be built in response to community needs, adoption trends, and organic usage patterns.
        </p>
        <p className="text-gray-300 mb-4">Potential additions:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Verified token communities</li>
          <li>• Tipping in SOL</li>
          <li>• Advanced discovery tools</li>
        </ul>
        <p className="text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          All updates will focus on simplicity and usability, keeping the platform uncluttered.
        </p>

        <h2 className="text-2xl font-semibold text-white mb-4">Conclusion</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          The roadmap emphasizes three core pillars:
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Rewards</strong> – payouts for active creators</li>
          <li>• <strong>Advertising</strong> – sustainable revenue from promoted content</li>
          <li>• <strong>Verification</strong> – optional subscriptions for credibility and platform support</li>
        </ul>
        <p className="text-gray-300 leading-relaxed">
          This ensures Social Memes grows sustainably while staying clean, simple, and crypto-native, with the community guiding future expansion.
        </p>
      </div>
    )
  }
]

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('introduction')
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started'])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Get all navigation items in order
  const getAllNavigationItems = () => {
    const items: { id: string; title: string }[] = []
    docSections.forEach(section => {
      if (section.children) {
        section.children.forEach(child => {
          items.push({ id: child.id, title: child.title })
        })
      } else if (section.content) {
        // Handle top-level sections without children
        items.push({ id: section.id, title: section.title })
      }
    })
    return items
  }

  const navigationItems = getAllNavigationItems()
  const currentIndex = navigationItems.findIndex(item => item.id === activeSection)
  const previousItem = currentIndex > 0 ? navigationItems[currentIndex - 1] : null
  const nextItem = currentIndex < navigationItems.length - 1 ? navigationItems[currentIndex + 1] : null

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const renderSection = (section: DocSection, level = 0) => {
    const isExpanded = expandedSections.includes(section.id)
    const hasChildren = section.children && section.children.length > 0
    const isActive = activeSection === section.id

    return (
      <div key={section.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(section.id)
            } else {
              setActiveSection(section.id)
              setIsMobileMenuOpen(false) // Close mobile menu when selecting a section
            }
          }}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors",
            level === 0 ? "text-sm font-medium" : "text-sm",
            isActive && !hasChildren
              ? "text-white font-bold"
              : "text-gray-300 hover:bg-gray-900/50 hover:text-white"
          )}
        >
          <div className="flex items-center space-x-3">
            <section.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{section.title}</span>
          </div>
          {hasChildren && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">({section.children?.length})</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </div>
          )}
        </button>
        
        {hasChildren && isExpanded && section.children && (
          <div className="ml-4 mt-1 space-y-1">
            {section.children.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const getActiveContent = () => {
    const findContent = (sections: DocSection[]): React.ReactNode => {
      for (const section of sections) {
        if (section.id === activeSection && section.content) {
          return section.content
        }
        if (section.children) {
          const found = findContent(section.children)
          if (found) return found
        }
      }
      return null
    }
    return findContent(docSections)
  }

  const renderContentCards = () => {
    if (activeSection === 'introduction') {
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Social Memes Documentation</h1>
            <p className="text-lg text-gray-300 mb-8">
              Everything you need to know about sharing memes, building community, and engaging with the Social Memes platform.
            </p>
          </div>

          {docSections.map(section => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center space-x-3">
                <section.icon className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.children?.filter(child => child.id !== 'introduction').map(child => (
                  <div
                    key={child.id}
                    onClick={() => setActiveSection(child.id)}
                    className="bg-black border border-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-900/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <child.icon className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {child.title}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {child.id === 'account-setup' && "Complete guide to creating and setting up your Social Memes account."}
                          {child.id === 'posting-memes' && "Learn how to create, upload, and share memes with the community."}
                          {child.id === 'interactions' && "Engage with content through likes, comments, and following other users."}
                          {child.id === 'notifications' && "Manage your notifications and stay updated with platform activity."}
                          {child.id === 'search-basics' && "Discover content and users with our powerful search and discovery features."}
                          {child.id === 'privacy-settings' && "Control your privacy and manage how others can interact with your content."}
                          {child.id === 'faq' && "Find answers to common questions about using the Social Memes platform."}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    return getActiveContent()
  }

  const renderNavigationButtons = () => {
    if (activeSection === 'introduction') return null

    return (
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
        <div className="flex justify-between items-center gap-8">
          <div className="flex-1 max-w-xs">
            {previousItem && (
              <button
                onClick={() => setActiveSection(previousItem.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Previous</div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                    {previousItem.title}
                  </div>
                </div>
              </button>
            )}
          </div>
          
          <div className="flex-1 max-w-xs flex justify-end">
            {nextItem && (
              <button
                onClick={() => setActiveSection(nextItem.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <div className="text-right min-w-0 flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Next</div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                    {nextItem.title}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <h1 className="text-lg font-bold text-white">Documentation</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Left Column - Navigation */}
        <div className={`
          fixed lg:fixed top-0 left-0 z-50 lg:z-auto
          w-80 bg-black h-screen
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full border-r border-gray-800 overflow-y-auto flex flex-col">
            <div className="p-4 lg:p-6 flex-1">
              <div className="flex items-center space-x-3 mb-6 lg:mb-8">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <h1 className="text-lg lg:text-xl font-bold text-white">Documentation</h1>
              </div>
              
              <nav className="space-y-2">
                {docSections.filter(section => !['platform-whitepaper', 'product-roadmap'].includes(section.id)).map(section => renderSection(section))}
              </nav>
            </div>
            
            {/* Pinned Roadmap Section */}
            <div className="p-4 lg:p-6 border-t border-gray-800">
              <nav className="space-y-2">
                {docSections.filter(section => ['platform-whitepaper', 'product-roadmap'].includes(section.id)).map(section => renderSection(section))}
              </nav>
            </div>
          </div>
        </div>
        
        {/* Right Column - Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContentCards() || (
              <div className="text-center py-8 lg:py-12">
                <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h2 className="text-lg lg:text-xl font-semibold text-gray-300 mb-2">Welcome to the Documentation</h2>
                <p className="text-gray-500">Select a topic from the sidebar to get started.</p>
              </div>
            )}
            {renderNavigationButtons()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocsPage
