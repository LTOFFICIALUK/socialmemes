'use client'

import { useState } from 'react'
import { Copy, Share2, Users, TrendingUp, Check, DollarSign, Calendar, Award, Target, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface ReferralsClientProps {
  profile: {
    id: string
    username: string
    referral_code: string
    referral_link: string
  }
  stats: {
    total_referrals: number
    recent_referrals: number
  }
  referrals: Array<{
    id: string
    username: string
    full_name?: string
    avatar_url?: string
    created_at: string
  }>
}

export const ReferralsClient = ({ profile, stats, referrals }: ReferralsClientProps) => {
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Mock earnings data - in a real app, this would come from the database
  const earningsData = {
    totalEarned: 125.50,
    pendingPayout: 45.25,
    nextPayoutDate: '2024-02-15',
    referralRate: 2.50, // $2.50 per referral
    lifetimeEarnings: 125.50
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy referral code:', err)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profile.referral_link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy referral link:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Social Memes!',
          text: `Join me on Social Memes and start sharing memes! Use my referral code: ${profile.referral_code}`,
          url: profile.referral_link,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copying link
      handleCopyLink()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Referral Analytics</h1>
          <p className="text-gray-400 text-lg">
            Track your referral performance and earnings
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Referrals */}
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Referrals</p>
                <p className="text-3xl font-bold text-white">{stats.total_referrals}</p>
                <p className="text-blue-200 text-xs mt-1">+{stats.recent_referrals} this month</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Earned</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(earningsData.totalEarned)}</p>
                <p className="text-green-200 text-xs mt-1">Lifetime earnings</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Pending Payout */}
          <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Pending Payout</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(earningsData.pendingPayout)}</p>
                <p className="text-yellow-200 text-xs mt-1">Next payout: {formatDate(earningsData.nextPayoutDate)}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Referral Rate */}
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Per Referral</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(earningsData.referralRate)}</p>
                <p className="text-purple-200 text-xs mt-1">Earned per signup</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Award className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code & Link Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Referral Code */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-400" />
              Your Referral Code
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-4">
                  <p className="text-3xl font-mono font-bold text-green-400 text-center">
                    {profile.referral_code}
                  </p>
                </div>
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800 px-6"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-blue-400" />
              Your Referral Link
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-300 break-all">
                    {profile.referral_link}
                  </p>
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800 px-6"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Referral Link
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Conversion Rate */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conversion Rate</h3>
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">12.5%</p>
              <p className="text-gray-400 text-sm">Link clicks to signups</p>
            </div>
          </div>

          {/* Top Performing Day */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Best Day</h3>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">5</p>
              <p className="text-gray-400 text-sm">Referrals on Jan 15</p>
            </div>
          </div>

          {/* Average per Month */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Avg</h3>
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{Math.round(stats.total_referrals / 3)}</p>
              <p className="text-gray-400 text-sm">Referrals per month</p>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-400" />
              Recent Referrals
            </h2>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg border border-gray-700/50"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={referral.avatar_url || undefined} alt={referral.username} />
                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                      {referral.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {referral.full_name || referral.username}
                    </p>
                    <p className="text-sm text-gray-400">@{referral.username}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                      {formatDate(referral.created_at)}
                    </Badge>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+{formatCurrency(earningsData.referralRate)}</p>
                      <p className="text-xs text-gray-500">Earned</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {referrals.length === 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-800/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">No referrals yet</h3>
              <p className="text-gray-400 mb-6 text-lg">
                Start sharing your referral code to invite friends and start earning!
              </p>
              <Button
                onClick={handleShare}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share Your Code
              </Button>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-6">How Referral Rewards Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Code</h3>
              <p className="text-gray-400 text-sm">
                Share your referral code or link with friends through social media, messaging, or any other way.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold mb-2">Friends Sign Up</h3>
              <p className="text-gray-400 text-sm">
                When friends use your referral code during signup, they&apos;ll be linked to your account.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-gray-400 text-sm">
                Earn {formatCurrency(earningsData.referralRate)} for each successful referral. Payouts are processed monthly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}