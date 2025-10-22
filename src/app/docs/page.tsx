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
  ArrowRight,
  Home,
  Crown,
  TrendingUp,
  DollarSign,
  UserPlus,
  Lock
} from 'lucide-react'
import Link from 'next/link'
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
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Welcome to Social Memes</h1>
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
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Account Setup</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Setting up your Social Memes account is quick and easy. Follow these steps to get started.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Creating Your Account</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Sign Up Process</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Visit socialmemes.fun - you&apos;ll be automatically redirected to the sign up page</li>
              <li>Enter your email address and create a secure password</li>
              <li>Choose a unique username (this will be your permanent profile handle)</li>
              <li>Click &quot;Sign up&quot; to create your account</li>
              <li>Check your email to verify your account</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
            <p className="text-gray-300 mb-4">Once your account is verified, you can:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Start exploring memes on the home feed</li>
              <li>Create and share your own memes</li>
              <li>Like and comment on posts</li>
              <li>Follow other users to build your network</li>
              <li>Search for content and discover new communities</li>
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
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Posting Memes</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Learn how to create and share memes on Social Memes platform.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Creating a Post</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Step-by-Step Guide</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Create a post using the &quot;Create Post&quot; button in the left navigation (opens a popup modal) or the post composer directly on the home feed</li>
              <li>Upload an image or select from your device</li>
              <li>Add a caption to your post</li>
              <li>Add a token attachment to link your post to a Solana token</li>
              <li>Click &quot;Post&quot; to share with the community</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Use high-quality images for better engagement</li>
              <li>Write engaging captions that add context</li>
              <li>Link relevant Solana tokens to increase visibility and connect with token communities</li>
              <li>Be respectful and follow community guidelines</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Image Guidelines</h2>
            <h3 className="text-xl font-semibold text-yellow-300 mb-4">Supported Formats</h3>
            <ul className="text-yellow-200 space-y-2 ml-4">
              <li>• JPEG, PNG, GIF formats</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        )
      },
      {
        id: 'interactions',
        title: 'Interactions',
        icon: Heart,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Interactions</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Engage with the community through likes, comments, and shares.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Liking Content</h2>
            <p className="text-gray-300 mb-4">Show appreciation for memes you enjoy:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Click the heart icon to like a post</li>
              <li>Authors receive notifications for likes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Comments and Replies</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Commenting System</h3>
            <ul className="space-y-3 text-gray-300 ml-4 mb-8">
              <li>• Click on any post to add your thoughts</li>
              <li>• Reply to specific comments for threaded discussions</li>
              <li>• Delete your own comments</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Following Users</h2>
            <p className="text-gray-300 mb-4">Build your network by following interesting creators:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4">
              <li>Visit a user&apos;s profile</li>
              <li>Click the &quot;Follow&quot; button</li>
              <li>Their posts will appear more frequently in your feed</li>
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
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Notifications</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Stay updated with real-time notifications about your activity and interactions.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Notification Types</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Activity Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-6">
              <li>• New likes on your posts</li>
              <li>• Comments on your content</li>
              <li>• Replies to your comments</li>
              <li>• New followers</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-4">Alpha Chat Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-6">
              <li>• New alpha chat subscriptions (when someone subscribes to your alpha chat)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-4">System Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-8">
              <li>• Account updates</li>
              <li>• Pro subscription status changes</li>
              <li>• Referral earnings and payouts</li>
              <li>• Platform announcements</li>
              <li>• Security alerts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">How Notifications Work</h2>
            <p className="text-gray-300 mb-4">Notifications are delivered in real-time to keep you connected with your community:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Notifications appear in the notification bell icon in the navigation</li>
              <li>Unread notifications are highlighted with a red badge showing the count</li>
              <li>Click on the notification bell to view all your notifications</li>
              <li>Notifications are automatically marked as read when you view them</li>
              <li>You&apos;ll receive notifications instantly when someone engages with your content</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Notification Best Practices</h2>
            <p className="text-gray-300 mb-4">Make the most of your notification experience:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Check your notifications regularly to stay engaged with your community</li>
              <li>Respond to comments and likes to build relationships with other users</li>
              <li>Use notifications to discover new content and users to follow</li>
              <li>Notifications help you track the performance and engagement of your posts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Troubleshooting Notifications</h2>
            <p className="text-gray-300 mb-4">If you&apos;re not receiving notifications:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Check your browser&apos;s notification settings for socialmemes.fun</li>
              <li>Ensure your browser allows notifications for this website</li>
              <li>Refresh the page if notifications seem delayed</li>
              <li>Make sure you&apos;re signed in to your account</li>
            </ul>

            <div className="bg-black border border-green-600 rounded-lg p-4">
              <p className="text-green-300">
                <strong>Pro Tip:</strong> Enable push notifications to never miss important interactions with your content.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'search-basics',
        title: 'Search & Discovery',
        icon: Search,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Search & Discovery</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Find posts, users, and tokens with our comprehensive search functionality.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">How Search Works</h2>
            <p className="text-gray-300 mb-4">Our search engine searches across all content types simultaneously:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Posts:</strong> Searches through post content and captions</li>
              <li><strong>Tokens:</strong> Searches through tagged Solana tokens (symbols)</li>
              <li><strong>Users:</strong> Searches through usernames and display names</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Search Interface</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Search Bar</h3>
            <p className="text-gray-300 mb-4">Enter your search term in the search bar to find:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Posts containing your keywords</li>
              <li>Posts tagged with specific token symbols</li>
              <li>Users with matching usernames or names</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Search Results</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Filtering Options</h3>
            <p className="text-gray-300 mb-4">After searching, filter your results using the tabs:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Popular:</strong> Posts sorted by likes and engagement</li>
              <li><strong>Latest:</strong> Posts sorted by creation date (newest first)</li>
              <li><strong>Users:</strong> User profiles matching your search</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Search Tips</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Search for token symbols (e.g., &quot;SOL&quot;, &quot;USDC&quot;) to find posts about specific tokens</li>
              <li>Search for usernames to find specific users</li>
              <li>Search for keywords to find posts with matching content</li>
              <li>Use the Popular tab to find the most engaging content</li>
              <li>Use the Latest tab to find recent posts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Discovery Features</h2>
            <h3 className="text-xl font-semibold text-blue-300 mb-4">Explore Page</h3>
            <p className="text-blue-200 mb-6">Browse the most recent memes and images in a grid layout to discover new content.</p>
            
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Trending Tokens</h3>
            <p className="text-purple-200 mb-8">View the top 10 trending Solana tokens based on post activity and engagement in the right sidebar.</p>

            <h2 className="text-2xl font-semibold text-white mb-4">Following Discovery</h2>
            <p className="text-gray-300 mb-4">Discover new users and content through search:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Find users with similar interests by searching for tokens you follow</li>
              <li>Follow users who post content you enjoy</li>
              <li>Discover trending tokens and communities</li>
              <li>Build your network by finding active creators</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'premium-features',
    title: 'Monetization',
    icon: Crown,
    children: [
        {
          id: 'platform-earnings',
          title: 'Platform Earnings',
          icon: DollarSign,
          content: (
            <div className="prose prose-invert max-w-none overflow-hidden">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Platform Earnings</h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                Learn how to earn SOL from your platform engagement through our bi-weekly revenue sharing system.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
              <p className="text-gray-300 mb-4">
                Social Memes operates a bi-weekly revenue sharing system where active users earn SOL based on their platform engagement. 
                The more you engage with the community, the more you earn.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Revenue Sources</h3>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• <strong>PumpFun Trading Fees:</strong> A portion of creator fees from token trading</li>
                <li>• <strong>Platform Revenue:</strong> Pro subscriptions and featured token promotions</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">Earning Opportunities</h2>
              <h3 className="text-xl font-semibold text-white mb-4">Content Creation</h3>
              <p className="text-gray-300 mb-4">
                Create posts and replies to earn engagement points. The more content you create, the more opportunities you have to earn.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Community Engagement</h3>
              <p className="text-gray-300 mb-4">
                Receive likes and follows to boost your earnings. Building an engaged community around your content increases your earning potential.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Interaction Scoring System</h2>
              <p className="text-gray-300 mb-4">
                Your earnings are calculated based on a weighted scoring system that rewards different types of engagement.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Scoring Weights</h3>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• <strong>Posts Created:</strong> Highest weight in the scoring system</li>
                <li>• <strong>Comments/Replies Created:</strong> High weight for community interaction</li>
                <li>• <strong>Follows Received:</strong> Medium weight for building your audience</li>
                <li>• <strong>Likes Received:</strong> Lower weight but adds up with engagement</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-4">How Scoring Works</h3>
              <p className="text-gray-300 mb-4">
                Your total interaction score is calculated by combining all your activities with their respective weights. 
                Posts have the highest impact on your score, followed by comments, follows, and likes.
              </p>
              <p className="text-gray-300 mb-6">
                The more you engage with the community through posts, comments, and interactions, the higher your score will be.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Payout Calculation</h2>
              <p className="text-gray-300 mb-4">
                Your SOL payout is calculated based on your share of the total interaction score pool.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Revenue Pool Distribution</h3>
              <h4 className="text-lg font-semibold text-white mb-4">Total Pool Sources</h4>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• <strong>PumpFun Pool:</strong> Significant portion of PumpFun creator fees</li>
                <li>• <strong>Platform Pool:</strong> Major portion from Pro subscriptions and featured tokens</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-4">Your Payout Formula</h3>
              <p className="text-gray-300 mb-4">
                Your SOL payout is calculated based on your proportional share of the total pool. Your share of the pool is determined by your interaction score relative to all users&apos; scores.
              </p>
              <p className="text-gray-300 mb-6">
                This ensures that users with higher engagement receive proportionally larger payouts.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Pro User Benefits</h2>
              <h3 className="text-xl font-semibold text-white mb-4">Pro User Advantage</h3>
              <p className="text-gray-300 mb-4">
                Pro users receive a <strong>significant multiplier</strong> on their interaction scores, 
                effectively increasing their earning potential substantially.
              </p>
              <p className="text-gray-300 mb-6">
                This means Pro users earn significantly more from the same level of engagement compared to regular users.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Payout Schedule</h2>
              <p className="text-gray-300 mb-4">
                Understanding when and how you&apos;ll receive your earnings from platform engagement.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Bi-Weekly Periods</h3>
              <p className="text-gray-300 mb-4">
                Earnings are calculated and distributed every two weeks in bi-weekly periods. Each period runs from Monday to Sunday.
              </p>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• <strong>Period Duration:</strong> 14 days (2 weeks)</li>
                <li>• <strong>Schedule:</strong> Monday to Sunday</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-4">Wallet Requirements</h3>
              <h4 className="text-lg font-semibold text-white mb-4">Important: Wallet Setup Required</h4>
              <p className="text-gray-300 mb-4">
                To receive payouts, you must have a valid Solana wallet address set in your profile. 
                Pro users are required to set up their payout wallet address.
              </p>
              <p className="text-gray-300 mb-6">
                If you don&apos;t have a wallet address set up, your earnings will be held until you provide one.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Maximizing Your Earnings</h2>
              <p className="text-gray-300 mb-4">
                Tips and strategies to increase your platform engagement and maximize your SOL earnings.
              </p>

              <h3 className="text-xl font-semibold text-white mb-4">Content Strategy</h3>
              <h4 className="text-lg font-semibold text-white mb-4">Create Quality Posts</h4>
              <p className="text-gray-300 mb-4">
                Posts have the highest weight in the scoring system, making them the most valuable for earning.
              </p>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• Share original, engaging memes and content</li>
                <li>• Post regularly to maintain consistent engagement</li>
                <li>• Use relevant hashtags to increase visibility</li>
                <li>• Engage with trending topics and discussions</li>
              </ul>

              <h4 className="text-lg font-semibold text-white mb-4">Active Commenting</h4>
              <p className="text-gray-300 mb-4">
                Comments and replies earn high weight points, making them a great way to boost your score.
              </p>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• Reply to posts with thoughtful comments</li>
                <li>• Engage in discussions and conversations</li>
                <li>• Ask questions to encourage responses</li>
                <li>• Share your perspective on trending topics</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-4">Community Building</h3>
              <h4 className="text-lg font-semibold text-white mb-4">Build Your Following</h4>
              <p className="text-gray-300 mb-4">
                Each follow you receive adds medium weight points to your score, helping you earn more over time.
              </p>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• Follow other active users to build relationships</li>
                <li>• Create content that encourages follows</li>
                <li>• Engage authentically with the community</li>
                <li>• Share valuable insights and entertainment</li>
              </ul>

              <h4 className="text-lg font-semibold text-white mb-4">Encourage Likes</h4>
              <p className="text-gray-300 mb-4">
                Likes on your content earn lower weight points, but they add up quickly with engaging posts.
              </p>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• Create shareable, likeable content</li>
                <li>• Post at optimal times for your audience</li>
                <li>• Use eye-catching visuals and captions</li>
                <li>• Engage with others&apos; content to build reciprocity</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-4">Best Practices</h3>
              <ul className="text-gray-300 space-y-2 ml-4 mb-6">
                <li>• Be consistent with your posting schedule</li>
                <li>• Engage authentically rather than just for points</li>
                <li>• Build genuine relationships with other users</li>
                <li>• Focus on quality over quantity in your content</li>
                <li>• Stay active throughout the bi-weekly period</li>
              </ul>
            </div>
          )
        },
      {
        id: 'pro-subscription',
        title: 'Pro Subscription',
        icon: Crown,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Pro Subscription</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Upgrade to Pro and unlock exclusive features, increased visibility, and special perks on Social Memes.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">What is Pro?</h2>
            <p className="text-gray-300 mb-4">
              Pro subscription is a premium membership that gives you enhanced capabilities and visibility on the platform. 
              Pro members receive a distinctive badge on their profile and gain access to exclusive features like Alpha Chats.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Pro Benefits</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Gold Username:</strong> Your username displays in gold to show your Pro status</li>
              <li><strong>Creator Earnings:</strong> Pro users can start earning from their posts and engagement</li>
              <li><strong>Alpha Chat Access:</strong> Enable your own Alpha Chat to create a premium subscription feed for your followers</li>
              <li><strong>Advertisement Discounts:</strong> Get 20% off all post and token promotions</li>
              <li><strong>Support the Platform:</strong> Help sustain Social Memes and fund creator rewards</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Subscription Plans</h2>
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Available Durations</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">1 Month</span>
                  <span className="text-green-400 font-bold">0.1 SOL</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">3 Months</span>
                  <span className="text-green-400 font-bold">0.25 SOL</span>
                  <span className="text-yellow-400 text-sm">17% savings</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">6 Months</span>
                  <span className="text-green-400 font-bold">0.45 SOL</span>
                  <span className="text-yellow-400 text-sm">25% savings</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">12 Months</span>
                  <span className="text-green-400 font-bold">0.8 SOL</span>
                  <span className="text-yellow-400 text-sm">33% savings</span>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4">How to Subscribe</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Ensure you have Phantom wallet installed with sufficient SOL</li>
              <li>Click on the Pro badge or Pro button in the navigation</li>
              <li>Select your preferred subscription duration</li>
              <li>Review the pricing and benefits</li>
              <li>Complete the payment through your Phantom wallet</li>
              <li>Your Pro status activates immediately upon payment confirmation</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Payment & Security</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>All payments are processed securely through the Solana blockchain</li>
              <li>Transactions are verified on-chain before subscription activation</li>
              <li>Your Pro status is linked to your account and cannot be transferred</li>
              <li>Subscriptions auto-expire at the end of the term (no auto-renewal)</li>
            </ul>

            <div className="bg-black border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-300">
                <strong>Pro Tip:</strong> Longer subscriptions offer better value per month. The 12-month plan provides the best discount!
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'alpha-chat',
        title: 'Alpha Chats',
        icon: Lock,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Alpha Chats</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Create a premium subscription-based content feed where you can share exclusive insights, alpha, and analysis with your paying subscribers.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">What are Alpha Chats?</h2>
            <p className="text-gray-300 mb-4">
              Alpha Chats are exclusive, subscription-based content feeds that allow creators to monetize their insights 
              and build a premium community. Only Pro users can enable Alpha Chats, and subscribers pay you directly 
              via your payout wallet address.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">For Alpha Chat Creators</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Requirements</h3>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-6">
              <li>Must have an active Pro subscription</li>
              <li>Must set up your payout wallet address in profile settings</li>
              <li>Payment from subscribers goes directly to your wallet with zero platform fees</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">Enabling Alpha Chat</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Subscribe to Pro if you haven&apos;t already</li>
              <li>Set up your payout wallet address in your profile settings</li>
              <li>Navigate to Pro settings and open Alpha Chat settings</li>
              <li>Toggle Alpha Chat to &quot;Enabled&quot;</li>
              <li>Your Alpha Chat feed is now active and visible to potential subscribers when they visit your profile</li>
            </ol>

            <h3 className="text-xl font-semibold text-white mb-4">Creating Alpha Content</h3>
            <p className="text-gray-300 mb-4">When Alpha Chat is enabled, you can:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Post exclusive messages visible only to your subscribers</li>
              <li>Share market analysis, trading insights, or alpha calls</li>
              <li>Build a premium community around your expertise</li>
              <li>Engage directly with your paying subscribers</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">For Subscribers</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Subscription Pricing</h3>
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">1 Month Access</span>
                  <span className="text-green-400 font-bold">0.1 SOL</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">3 Months Access</span>
                  <span className="text-green-400 font-bold">0.25 SOL</span>
                  <span className="text-yellow-400 text-sm">17% savings</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">6 Months Access</span>
                  <span className="text-green-400 font-bold">0.45 SOL</span>
                  <span className="text-yellow-400 text-sm">25% savings</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-300">12 Months Access</span>
                  <span className="text-green-400 font-bold">0.8 SOL</span>
                  <span className="text-yellow-400 text-sm">33% savings</span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">How to Subscribe</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Visit the profile of a creator with Alpha Chat enabled</li>
              <li>Click on their Alpha Chat section</li>
              <li>Select your preferred subscription duration</li>
              <li>Complete payment through Phantom wallet</li>
              <li>Payment goes directly to the creator&apos;s wallet</li>
              <li>Access is granted immediately upon payment confirmation</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Features & Interactions</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Real-time Feed:</strong> See new messages as they&apos;re posted</li>
              <li><strong>Like Messages:</strong> Show appreciation for valuable insights</li>
              <li><strong>Notifications:</strong> Get notified of new alpha content</li>
            </ul>

            <div className="bg-black border border-purple-600 rounded-lg p-4">
              <p className="text-purple-300">
                <strong>Important:</strong> Alpha Chat subscriptions expire at the end of the term. Payments go directly to creators&apos; wallets, not through the platform.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'referrals',
        title: 'Referral Program',
        icon: UserPlus,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Referral Program</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Earn rewards by inviting friends to join Social Memes. Receive a portion of your referred users&apos; earnings on the platform.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
            <p className="text-gray-300 mb-4">
              The referral program allows you to earn passive income by growing the Social Memes community. 
              When someone signs up using your referral code or link, you become their referrer and earn a percentage 
              of their future platform earnings.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Your Referral Code</h2>
            <p className="text-gray-300 mb-4">
              Every user automatically receives a unique referral code based on their username. 
              You can find your referral code and link on the Referrals page in your navigation menu.
            </p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Referral Code:</strong> Your username in uppercase (e.g., JOHNDOE)</li>
              <li><strong>Referral Link:</strong> A shareable link that includes your code</li>
              <li><strong>Easy Sharing:</strong> Copy your code/link to share with others</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Earning from Referrals</h2>
            <p className="text-gray-300 mb-4">
              When users you refer earn money on Social Memes (through creator rewards, payouts, etc.), 
              you automatically receive a small percentage of their earnings as referral commission.
            </p>
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Passive Income</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Earn from your referrals&apos; platform earnings</li>
                <li>Track total earned and pending payouts</li>
                <li>See your next scheduled payout date</li>
                <li>View all your referred users and their activity</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4">How to Refer Users</h2>
            <h3 className="text-xl font-semibold text-white mb-4">For Referrers</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Navigate to the Referrals page from the menu</li>
              <li>Copy your referral code or referral link</li>
              <li>Share with friends, on social media, or in communities</li>
              <li>New users enter your code during signup or use your link</li>
              <li>Track your referrals and earnings on the Referrals page</li>
            </ol>

            <h3 className="text-xl font-semibold text-white mb-4">For New Users</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Click a referral link or go to the signup page</li>
              <li>Enter the referral code in the optional referral code field</li>
              <li>The code is automatically validated as you type</li>
              <li>Complete your signup process</li>
              <li>You&apos;re now linked to your referrer</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Referral Dashboard</h2>
            <p className="text-gray-300 mb-4">The Referrals page provides comprehensive tracking:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Total Referrals:</strong> How many users you&apos;ve referred</li>
              <li><strong>Total Earned:</strong> All-time referral earnings</li>
              <li><strong>Pending Payout:</strong> Earnings awaiting next payout</li>
              <li><strong>Referral List:</strong> See all users you&apos;ve referred and how much you earned from each</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Payout Information</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Referral earnings are tracked in real-time</li>
              <li>Payouts are not automatic - you must claim your earnings manually</li>
              <li>Visit the Referrals page and click to claim your earnings</li>
              <li>A Phantom popup will appear to send your earnings to your wallet</li>
              <li>Make sure to set up your payout wallet in profile settings</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Share your referral link in relevant communities and groups</li>
              <li>Explain the benefits of joining Social Memes to potential referrals</li>
              <li>Be authentic and transparent about the platform</li>
              <li>Don&apos;t spam or use deceptive practices</li>
              <li>Help your referrals get started and engaged on the platform</li>
            </ul>

          </div>
        )
      }
    ]
  },
  {
    id: 'advertising',
    title: 'Advertising',
    icon: TrendingUp,
    children: [
      {
        id: 'post-promotion',
        title: 'Post Promotion',
        icon: TrendingUp,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Post Promotion</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Boost your posts to reach a wider audience and increase engagement through promoted visibility in the main feed.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">What is Post Promotion?</h2>
            <p className="text-gray-300 mb-4">
              Post promotion allows you to boost the visibility of your memes and content across Social Memes. 
              Promoted posts appear more prominently in the main feed, helping you reach more viewers and drive engagement.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Promoted posts receive boosted visibility in the main feed</li>
              <li>Your content appears more frequently to users browsing the platform</li>
              <li>Promotion runs for the duration you select</li>
              <li>You can promote any of your existing posts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Pricing</h2>
            <p className="text-gray-300 mb-4">
              Promotion pricing is based on duration. The longer you promote, the more visibility you get.
            </p>
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pro Users: 20% Discount</h3>
              <p className="text-gray-400 mb-4">Pro subscribers automatically receive a 20% discount on all post promotions.</p>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4">How to Promote a Post</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Navigate to the post you want to promote</li>
              <li>Click the promote button (if available on the post)</li>
              <li>Select your desired promotion duration</li>
              <li>Review the pricing (Pro users see discounted rates)</li>
              <li>Complete payment through your Phantom wallet</li>
              <li>Your post becomes promoted immediately after payment confirmation</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Promote high-quality, engaging content for best results</li>
              <li>Choose duration based on your content&apos;s relevance timeline</li>
              <li>Use promotion for posts with token attachments to boost token visibility</li>
              <li>Consider promoting when your target audience is most active</li>
            </ul>


            <div className="bg-black border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300">
                <strong>Tip:</strong> Pro users save 20% on every promotion. If you promote frequently, a Pro subscription can pay for itself!
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'token-promotion',
        title: 'Token Promotion',
        icon: DollarSign,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Token Promotion (Featured Tokens)</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Promote your Solana token with featured placement in the trending tokens section, driving visibility and engagement for your project.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">What is Token Promotion?</h2>
            <p className="text-gray-300 mb-4">
              Token promotion (Featured Tokens) allows you to showcase your Solana token in a premium, high-visibility 
              section of the platform. Featured tokens appear prominently in the trending tokens sidebar, reaching users 
              actively engaged with the crypto community on Social Memes.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Featured tokens appear in the trending tokens section on the right sidebar</li>
              <li>Your token is displayed with a custom image and clickable link</li>
              <li>Limited to 8 featured token slots at any time (premium positioning)</li>
              <li>Promotion runs for your selected duration</li>
              <li>Users can click through to your specified destination URL (website, DEX, etc.)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">What You Need</h2>
            <p className="text-gray-300 mb-4">To create a token promotion, you&apos;ll need:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li><strong>Token Image:</strong> Upload a high-quality image representing your token (logo, artwork, etc.)</li>
              <li><strong>Destination URL:</strong> Where users go when they click (your website, DEX listing, socials, etc.)</li>
              <li><strong>Optional Title:</strong> Optionally add a custom title for your featured token (not displayed to users)</li>
              <li><strong>Duration:</strong> How long you want the promotion to run</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Pricing</h2>
            <p className="text-gray-300 mb-4">
              Token promotion pricing is based on duration. Featured placement is limited to maintain exclusivity.
            </p>
            <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pro Users: 20% Discount</h3>
              <p className="text-gray-400 mb-4">
                Pro subscribers automatically receive a 20% discount on all token promotions.
              </p>
              <h3 className="text-lg font-semibold text-white mb-4 mt-6">Limited Availability</h3>
              <p className="text-gray-400">
                Only 8 featured token slots available at any time. If all slots are full, you&apos;ll need to wait for an opening.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4">How to Promote a Token</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Ensure you have a token image uploaded and a destination URL ready</li>
              <li>Navigate to the featured tokens promotion section</li>
              <li>Upload your token image or provide an image URL</li>
              <li>Enter your destination URL (must be a valid URL)</li>
              <li>Optionally add a custom title</li>
              <li>Select your promotion duration</li>
              <li>Review pricing (Pro users see discounted rates)</li>
              <li>Complete payment through your Phantom wallet</li>
              <li>Your token appears in the featured section immediately upon confirmation</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Use high-quality, eye-catching images for better click-through rates</li>
              <li>Ensure your destination URL works and provides value</li>
              <li>Choose a duration that aligns with your marketing campaign</li>
              <li>Time promotions with token launches or major announcements</li>
              <li>Make sure your destination page is mobile-friendly</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Promotion Guidelines</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Images must be appropriate and follow community guidelines</li>
              <li>Destination URLs must be legitimate and not scams</li>
              <li>No misleading or false advertising</li>
              <li>Platform reserves the right to remove promotions that violate guidelines</li>
            </ul>

            <div className="bg-black border border-green-600 rounded-lg p-4">
              <p className="text-green-300">
                <strong>Success Tip:</strong> Combine token promotion with posting engaging content about your token to maximize visibility and community engagement!
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Support',
    icon: Settings,
    children: [
      {
        id: 'privacy-settings',
        title: 'Privacy Settings',
        icon: Shield,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Privacy Settings</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Control your privacy and manage how others can interact with your content.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Account Security</h2>
            <h3 className="text-xl font-semibold text-red-300 mb-4">Security Features</h3>
            <ul className="text-red-200 space-y-2 ml-4 mb-8">
              <li>• Login activity monitoring</li>
              <li>• Password strength requirements</li>
              <li>• Suspicious activity alerts</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Platform Information</h2>
            <p className="text-gray-300 mb-4">
              Social Memes is a decentralized platform that operates with community-driven moderation. 
              As a decentralized platform, we have limited centralized moderation capabilities and rely 
              on community reporting and self-regulation.
            </p>
            
            <p className="text-gray-300 mb-4">
              This platform does not include parental controls or automated content filtering systems. 
              All content is user-generated and publicly visible. Users are encouraged to be mindful 
              of the content they share and consume.
            </p>
            
            <p className="text-gray-300 mb-8">
              While we encourage respectful behavior and have community guidelines in place, 
              enforcement is primarily community-driven. Users can report inappropriate content, 
              but moderation responses may vary based on community input and available resources.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Staying Safe</h2>
            <p className="text-gray-300 mb-4">Best practices for using Social Memes safely:</p>
            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 mb-8">
              <li>Be mindful of the content you share and consume</li>
              <li>Report inappropriate content when you encounter it</li>
              <li>Don&apos;t share personal information publicly</li>
              <li>Be cautious when interacting with unknown users</li>
              <li>Remember that all content is public and permanent</li>
            </ul>
          </div>
        )
      },
      {
        id: 'faq',
        title: 'FAQs',
        icon: HelpCircle,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Frequently Asked Questions</h1>
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
              <li>• Follow us on X and join our Telegram community</li>
              <li>• Check our status page for service updates</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'policies',
    title: 'Policies',
    icon: Shield,
    children: [
      {
        id: 'terms-of-service',
        title: 'Terms of Service',
        icon: BookOpen,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Terms of Service</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Please read these terms carefully before using Social Memes.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300 mb-6">
              By accessing and using Social Memes, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Use License</h2>
            <p className="text-gray-300 mb-4">Permission is granted to temporarily use Social Memes for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">User Content</h2>
            <p className="text-gray-300 mb-4">You are responsible for all content you post on Social Memes. By posting content, you agree that:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>You own or have the right to use the content</li>
              <li>Your content does not violate any laws or third-party rights</li>
              <li>Your content is not harmful, offensive, or inappropriate</li>
              <li>You grant Social Memes a license to display and distribute your content</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Prohibited Uses</h2>
            <p className="text-gray-300 mb-4">You may not use Social Memes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
            <p className="text-gray-300 mb-6">
              The information on this website is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, 
              Social Memes excludes all representations, warranties, conditions and terms relating to our website and 
              the use of this website.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Limitations</h2>
            <p className="text-gray-300 mb-6">
              In no event shall Social Memes or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
              to use the materials on Social Memes, even if Social Memes or an authorized representative has been 
              notified orally or in writing of the possibility of such damage.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p className="text-gray-300 mb-6">
              Social Memes may revise these terms of service at any time without notice. By using this website, 
              you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>
        )
      },
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        icon: Shield,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Privacy Policy</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              This privacy policy explains how Social Memes collects, uses, and protects your information.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Email address and password for account creation</li>
              <li>Username and display name</li>
              <li>Profile picture and banner image</li>
              <li>Bio and other profile information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-4">Content Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Posts, comments, and other content you create</li>
              <li>Images and media you upload</li>
              <li>Token information you attach to posts</li>
              <li>Engagement data (likes, follows, etc.)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Provide and maintain the Social Memes platform</li>
              <li>Display your content to other users</li>
              <li>Send you notifications about activity on your posts</li>
              <li>Improve our services and user experience</li>
              <li>Ensure platform security and prevent abuse</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
            <p className="text-gray-300 mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Your public profile and posts are visible to all users</li>
              <li>We may share information with service providers who help us operate the platform</li>
              <li>We may disclose information if required by law or to protect our rights</li>
              <li>We do not sell your personal information to third parties</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
            <p className="text-gray-300 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Access and update your account information</li>
              <li>Delete your account and associated data</li>
              <li>Control your privacy settings</li>
              <li>Request a copy of your data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-6">
              If you have any questions about this privacy policy, please contact us at privacy@socialmemes.fun
            </p>
          </div>
        )
      },
      {
        id: 'community-guidelines',
        title: 'Community Guidelines',
        icon: Users,
        content: (
          <div className="prose prose-invert max-w-none overflow-hidden">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 break-words">Community Guidelines</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Help us maintain a positive and respectful community on Social Memes.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Be Respectful</h2>
            <p className="text-gray-300 mb-4">Treat all community members with respect and kindness:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Use respectful language in all interactions</li>
              <li>Be considerate of different opinions and perspectives</li>
              <li>Avoid personal attacks or harassment</li>
              <li>Respect others&apos; privacy and boundaries</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Share Quality Content</h2>
            <p className="text-gray-300 mb-4">Help maintain a high-quality community by:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Sharing original and engaging memes and content</li>
              <li>Adding meaningful captions to your posts</li>
              <li>Using relevant token attachments when appropriate</li>
              <li>Avoiding spam or repetitive content</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Prohibited Content</h2>
            <p className="text-gray-300 mb-4">The following content is not allowed:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Hate speech, discrimination, or harassment</li>
              <li>Violence, graphic content, or disturbing imagery</li>
              <li>Spam, scams, or misleading information</li>
              <li>Copyright infringement or stolen content</li>
              <li>Illegal activities or content</li>
              <li>NSFW content or explicit material</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Token and Crypto Guidelines</h2>
            <p className="text-gray-300 mb-4">When discussing tokens and cryptocurrency:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Do not provide financial advice</li>
              <li>Be transparent about your positions or interests</li>
              <li>Avoid pump and dump schemes or market manipulation</li>
              <li>Respect others&apos; investment decisions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Reporting and Enforcement</h2>
            <p className="text-gray-300 mb-4">Help us maintain community standards:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Report content that violates these guidelines</li>
              <li>Use the report function on posts and comments</li>
              <li>Provide constructive feedback when possible</li>
              <li>Remember that enforcement is community-driven</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4">Consequences</h2>
            <p className="text-gray-300 mb-6">
              Violations of these guidelines may result in content removal, account restrictions, or account suspension. 
              We rely on community reporting and self-regulation to maintain these standards.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4">Questions or Concerns</h2>
            <p className="text-gray-300 mb-6">
              If you have questions about these guidelines or need to report a serious violation, 
              please contact us at community@socialmemes.fun
            </p>
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
          <li>• Alpha Chat subscriptions (when someone subscribes to your Alpha Chat)</li>
          <li>• No notifications for shares or token activity</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">2.5 Profile Pages</h3>
        <p className="text-gray-300 mb-4">Public profile includes:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Banner image</li>
          <li>• Profile picture, display name, and permanent username (set at signup and cannot be changed)</li>
          <li>• Bio and stats (posts, followers, following)</li>
          <li>• User&apos;s shared memes and text posts</li>
          <li>• Alpha Chat section (if enabled by Pro users)</li>
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

        <h2 className="text-2xl font-semibold text-white mb-4">5. Monetization & Premium Features</h2>
        
        <h3 className="text-xl font-semibold text-white mb-4">5.1 Pro Subscription</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Gold Username:</strong> Pro users display gold usernames to show their premium status</li>
          <li>• <strong>Creator Earnings:</strong> Pro users can start earning from their posts and engagement</li>
          <li>• <strong>Alpha Chat Access:</strong> Pro users can create premium subscription content feeds</li>
          <li>• <strong>Advertisement Discounts:</strong> 20% off all post and token promotions</li>
          <li>• <strong>Pricing:</strong> 0.1 SOL/month, with discounts for longer commitments (3, 6, 12 months)</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">5.2 Alpha Chats</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Premium Content:</strong> Pro users can create exclusive subscription-based content feeds</li>
          <li>• <strong>Direct Payments:</strong> Subscribers pay directly to creators with zero platform fees</li>
          <li>• <strong>Subscription Tiers:</strong> 1 month (0.1 SOL), 3 months (0.25 SOL), 6 months (0.45 SOL), 12 months (0.8 SOL)</li>
          <li>• <strong>Real-time Feed:</strong> Subscribers see new alpha messages as they&apos;re posted</li>
          <li>• <strong>Creator Requirements:</strong> Must have Pro subscription and payout wallet set up</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">5.3 Advertising</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Post Promotion:</strong> Boost visibility in the main feed for increased engagement</li>
          <li>• <strong>Token Promotion:</strong> Featured placement in trending tokens section (max 8 active)</li>
          <li>• <strong>Pro Discounts:</strong> 20% off all advertising for Pro subscribers</li>
          <li>• <strong>Duration-based Pricing:</strong> Longer promotions provide better value</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">5.4 Referral Program</h3>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Earn from Referrals:</strong> Receive a portion of referred users&apos; earnings on the platform</li>
          <li>• <strong>Unique Codes:</strong> Every user gets a referral code based on their username</li>
          <li>• <strong>Manual Payouts:</strong> Claim earnings manually through Phantom wallet popup</li>
          <li>• <strong>Real-time Tracking:</strong> Referral earnings tracked in real-time on referrals page</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">6. Technical Foundation</h2>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• <strong>Frontend</strong> – responsive web interface optimized for both desktop and mobile</li>
          <li>• <strong>Backend</strong> – scalable API infrastructure for handling user data, content, engagement, and monetization</li>
          <li>• <strong>Storage</strong> – centralized media storage at launch, with future options for decentralized hosting</li>
          <li>• <strong>Blockchain Integration</strong> – built natively on Solana, using its token ecosystem for post attachments, trending token tracking, and payments</li>
          <li>• <strong>Payment Infrastructure</strong> – integrated Phantom wallet for Pro subscriptions, Alpha Chat payments, and advertising transactions</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">7. Summary</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Social Memes is a Solana-native social platform where users share memes and text posts, engage with each other, and connect their content to tokens.
        </p>
        <p className="text-gray-300 mb-4">The platform includes:</p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• A familiar feed-based structure with post promotion capabilities</li>
          <li>• Grid-style meme discovery via Explore</li>
          <li>• Profile pages with permanent usernames, customizable banners, and Alpha Chat integration</li>
          <li>• Post pages supporting both memes and text posts, with optional token attachments</li>
          <li>• A real-time list of trending Solana tokens ranked by post activity and engagement</li>
          <li>• Pro subscription system with creator earnings and premium features</li>
          <li>• Alpha Chat premium content feeds with direct creator payments</li>
          <li>• Advertising system for post and token promotion</li>
          <li>• Referral program for community growth and user rewards</li>
        </ul>
        <p className="text-gray-300 leading-relaxed">
          By combining proven social features with token integration and comprehensive monetization tools, Social Memes provides a complete crypto-native experience that rewards creators, supports community growth, and maintains focus on meme culture and Solana communities.
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Social Memes Product Roadmap</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">Strategic Vision</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          Social Memes is designed to remain clean, simple, and user-first while establishing token-aware social experiences.
        </p>
        <p className="text-gray-300 mb-6 sm:mb-8 leading-relaxed">
          Our phase-based approach introduces core utilities for growth and sustainability, establishing feature parity with leading social networks while introducing unique token-native mechanics that centralized platforms cannot replicate.
        </p>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 1 — Core Platform Expansion</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Establishing the foundation for token-aware social experiences.
        </p>
        
        <h3 className="text-xl font-semibold text-white mb-4">Token Community Chats</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Clicking a token tag opens a dedicated community chat page for that token, similar to community features on other platforms but natively integrated into Social Memes.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Auto-generated community pages for each token</li>
          <li>• Token metrics and data integration</li>
          <li>• Decentralized community ownership model</li>
          <li>• Enhanced discovery through dedicated Communities tab</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">Token Hover Previews</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Hovering over token tags displays instant context cards with key metrics and quick access links.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Lightweight hover card components</li>
          <li>• Real-time token data integration</li>
          <li>• Consistent experience across all platform sections</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">MP4 Video Support</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Enable video uploads and playback to support modern meme formats and increase content diversity.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Video upload and storage infrastructure</li>
          <li>• Optimized playback with mobile compatibility</li>
          <li>• Support for short clips and GIF-like content</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 2 — User Experience & Safety Layer</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Refining the social experience to meet modern platform standards.
        </p>

        <h3 className="text-xl font-semibold text-white mb-4">Profile Enhancements</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Upgrade profiles with stronger personal branding tools and improved content presentation capabilities.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Pinned posts for profile feeds and community chats</li>
          <li>• External links section for website and social connections</li>
          <li>• Refined layout for highlighted content presentation</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">Privacy & Safety Settings</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Comprehensive privacy controls and user safety features to establish trust and user control.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• User blocking and muting capabilities</li>
          <li>• Granular notification settings</li>
          <li>• Profile visibility and privacy options</li>
          <li>• Content filtering and moderation tools</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">Email Notifications & Marketing</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Email infrastructure for user engagement, retention, and structured communication.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Email notifications for key platform events</li>
          <li>• Digest emails and engagement summaries</li>
          <li>• Marketing compliance and user communication</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 3 — Intelligence & Creator Infrastructure</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Layering analytics, security, and professional tools to scale creator success.
        </p>

        <h3 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Comprehensive analytics suite for creators and token teams to track growth and content performance.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Post engagement metrics and performance tracking</li>
          <li>• Account growth and follower analytics</li>
          <li>• Token-specific engagement insights</li>
          <li>• Data export and reporting capabilities</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-4">AI Spam & Scam Detection</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          AI-driven content moderation and user reporting tools to protect platform integrity and build user trust.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Automated detection of malicious content</li>
          <li>• Real-time content scoring and filtering</li>
          <li>• User reporting system with reason categorization</li>
          <li>• Admin moderation dashboard and tools</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Phase 4 — Mobile Expansion & Ecosystem Integration</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Delivering a native experience and scaling distribution across platforms.
        </p>

        <h3 className="text-xl font-semibold text-white mb-4">Native Mobile Apps</h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          Fully functional native iOS and Android applications with mobile-optimized features and performance.
        </p>
        <ul className="text-gray-300 space-y-2 ml-4 mb-6">
          <li>• Native UI for all core platform features</li>
          <li>• Push notifications for user engagement</li>
          <li>• Mobile-optimized content creation tools</li>
          <li>• App store distribution and discovery</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Strategic Impact</h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
          By progressing through these phases, Social Memes will establish feature parity with leading social networks while introducing unique token-native community and discovery mechanics. This approach provides creators and projects with professional tools and analytics while delivering a mobile-first experience that enables broader adoption across the Solana ecosystem.
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
            "w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors cursor-pointer",
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

          {/* Platform & Whitepaper Cards */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docSections.filter(section => ['platform-whitepaper', 'product-roadmap'].includes(section.id)).map(section => (
                <div
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="bg-black border border-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-900/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <section.icon className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {section.id === 'platform-whitepaper' && "Learn about the platform structure, token integration, and technical foundation of Social Memes."}
                        {section.id === 'product-roadmap' && "Explore the future development plans and upcoming features for the platform."}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {docSections.filter(section => !['platform-whitepaper', 'product-roadmap'].includes(section.id)).map(section => (
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
                          {child.id === 'notifications' && "Manage your notifications and stay updated with platform activity including alpha chats."}
                          {child.id === 'pro-subscription' && "Upgrade to Pro for exclusive features, badges, and platform-wide benefits."}
                          {child.id === 'alpha-chat' && "Create premium subscription content feeds and monetize your insights."}
                          {child.id === 'referrals' && "Earn passive income by inviting friends and growing the community."}
                          {child.id === 'post-promotion' && "Boost your posts for increased visibility and engagement."}
                          {child.id === 'token-promotion' && "Promote your Solana token in featured placement for maximum exposure."}
                          {child.id === 'search-basics' && "Discover content and users with our powerful search and discovery features."}
                          {child.id === 'privacy-settings' && "Control your privacy and manage how others can interact with your content."}
                          {child.id === 'terms-of-service' && "Read the terms and conditions for using Social Memes."}
                          {child.id === 'privacy-policy' && "Learn how we collect, use, and protect your information."}
                          {child.id === 'community-guidelines' && "Guidelines for maintaining a positive community environment."}
                          {child.id === 'faq' && "Frequently asked questions about using the Social Memes platform."}
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
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer"
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
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer"
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <BookOpen className="h-6 w-6 text-blue-500 flex-shrink-0" />
          <h1 className="text-lg font-bold text-white truncate">Documentation</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-300 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex min-w-0">
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
                <Link 
                  href="/"
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors text-sm font-medium text-gray-300 hover:bg-gray-900/50 hover:text-white cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">Home</span>
                  </div>
                </Link>
                
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
        <div className="flex-1 lg:ml-80 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 min-w-0">
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
