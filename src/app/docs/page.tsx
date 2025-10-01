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
  Home
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
              <li>• New followers</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-white mb-4">System Notifications</h3>
            <ul className="text-gray-300 space-y-2 ml-4 mb-8">
              <li>• Account updates</li>
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
    id: 'settings',
    title: 'Settings & Privacy',
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
              <li>• Join our community Discord server</li>
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
                          {child.id === 'notifications' && "Manage your notifications and stay updated with platform activity."}
                          {child.id === 'search-basics' && "Discover content and users with our powerful search and discovery features."}
                          {child.id === 'privacy-settings' && "Control your privacy and manage how others can interact with your content."}
                          {child.id === 'terms-of-service' && "Read the terms and conditions for using Social Memes."}
                          {child.id === 'privacy-policy' && "Learn how we collect, use, and protect your information."}
                          {child.id === 'community-guidelines' && "Guidelines for maintaining a positive community environment."}
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
