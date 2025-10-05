'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { ProModal } from '@/components/pro-modal'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { PromotionModal } from '@/components/promotion-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'

interface Profile {
  id: string
  username: string
  referral_code: string
  referral_link: string
}

interface Stats {
  total_referrals: number
  recent_referrals: number
}

interface EarningsData {
  total_earned: number
  pending_payout: number
  next_payout_date: string | null
}

interface Referral {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export const ReferralsClient = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ total_referrals: 0, recent_referrals: 0 })
  const [earningsData, setEarningsData] = useState<EarningsData>({ 
    total_earned: 0, 
    pending_payout: 0, 
    next_payout_date: null
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [showProModal, setShowProModal] = useState(false)
  const [showFeaturedTokenModal, setShowFeaturedTokenModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const router = useRouter()
  const { toasts, removeToast, success } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/signin')
          return
        }

        // Get user profile with referral data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, referral_code, referral_link, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          console.error('Profile error:', profileError)
          router.push('/auth/signin')
          return
        }

        setProfile(profileData)
        
        // Set current user with fresh profile data from database
        setCurrentUser({
          id: user.id,
          username: profileData.username,
          avatar_url: profileData.avatar_url
        })

        // Get referral statistics
        const { data: statsData } = await supabase
          .rpc('get_referral_stats', { user_id: user.id })

        if (statsData && statsData[0]) {
          setStats(statsData[0])
        }

        // Get earnings data from referral_data table
        const { data: referralData, error: referralDataError } = await supabase
          .from('referral_data')
          .select('total_earned, pending_payout, next_payout_date')
          .eq('user_id', user.id)
          .single()

        if (referralData && !referralDataError) {
          setEarningsData({
            total_earned: Number(referralData.total_earned) || 0,
            pending_payout: Number(referralData.pending_payout) || 0,
            next_payout_date: referralData.next_payout_date
          })
        }

        // Get recent referrals
        const { data: referralsData } = await supabase
          .rpc('get_user_referrals', { user_id: user.id, limit_count: 20, offset_count: 0 })

        if (referralsData) {
          setReferrals(referralsData)
        }

      } catch (error) {
        console.error('Error fetching referral data:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handlePromotePost = (postId: string) => {
    setSelectedPostId(postId)
    setShowPromotionModal(true)
  }

  const handlePromoteConfirm = async (postId: string, duration: number, price: number) => {
    console.log('Promoting post:', { postId, duration, price })
    success(`Post promoted for ${duration} hours at ${price} SOL!`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCopyCode = async () => {
    if (!profile) return
    try {
      await navigator.clipboard.writeText(profile.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy referral code:', err)
    }
  }

  const handleCopyLink = async () => {
    if (!profile) return
    try {
      await navigator.clipboard.writeText(profile.referral_link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy referral link:', err)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        <div className="flex h-screen max-w-7xl mx-auto min-w-0">
          {/* Left Column - Navigation */}
          <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
            <Navigation 
              currentUser={currentUser} 
              onSignOut={handleSignOut}
              onPromoteClick={() => setShowFeaturedTokenModal(true)}
              onProClick={() => setShowProModal(true)}
            />
          </div>
          
          {/* Center Column - Loading */}
          <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading referral data...</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <MobileNavigation 
          currentUser={currentUser} 
          onSignOut={handleSignOut}
          onPromoteClick={() => setShowFeaturedTokenModal(true)}
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        <div className="flex h-screen max-w-7xl mx-auto min-w-0">
          {/* Left Column - Navigation */}
          <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
            <Navigation 
              currentUser={currentUser} 
              onSignOut={handleSignOut}
              onPromoteClick={() => setShowFeaturedTokenModal(true)}
              onProClick={() => setShowProModal(true)}
            />
          </div>
          
          {/* Center Column - Error */}
          <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400">Unable to load referral data</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <MobileNavigation 
          currentUser={currentUser} 
          onSignOut={handleSignOut}
          onPromoteClick={() => setShowFeaturedTokenModal(true)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="flex h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation 
            currentUser={currentUser} 
            onSignOut={handleSignOut}
            onPromoteClick={() => setShowFeaturedTokenModal(true)}
            onProClick={() => setShowProModal(true)}
          />
        </div>
        
        {/* Center Column - Referral Analytics */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Referral Analytics</h1>
              <p className="text-sm text-gray-400">Track your referral performance and earnings</p>
            </div>
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenuButton 
                currentUser={currentUser} 
                onSignOut={handleSignOut}
                onPromoteClick={() => setShowFeaturedTokenModal(true)}
                onTrendingClick={() => setShowTrendingModal(true)}
                onProClick={() => setShowProModal(true)}
              />
            </div>
          </div>
          
          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-w-0 p-4 space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Referrals */}
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{stats.total_referrals}</p>
                  <p className="text-gray-500 text-xs mt-1">+{stats.recent_referrals} this month</p>
                </div>
              </div>

              {/* Total Earned */}
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(earningsData.total_earned)}</p>
                  <p className="text-gray-500 text-xs mt-1">Lifetime earnings</p>
                </div>
              </div>

              {/* Pending Payout */}
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <p className="text-gray-400 text-sm">Pending Payout</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(earningsData.pending_payout)}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {earningsData.next_payout_date ? `Next payout: ${formatDate(earningsData.next_payout_date)}` : 'No pending payout'}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Code & Link Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Referral Code */}
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-white">Your Referral Code</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3">
                        <p className="text-sm text-white text-center">
                          {profile.referral_code}
                        </p>
                      </div>
                      <Button
                        onClick={handleCopyCode}
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-800 px-4 text-white"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Link */}
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <h2 className="text-lg font-semibold mb-3 text-white">Your Referral Link</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="text-sm text-white break-all">
                          {profile.referral_link}
                        </p>
                      </div>
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-800 px-4 text-white"
                      >
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Referrals */}
            {referrals.length > 0 && (
              <div className="bg-black border border-gray-800 rounded-lg p-4">
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-white">Recent Referrals</h2>
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg border border-gray-700"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={referral.avatar_url || undefined} alt={referral.username} />
                          <AvatarFallback className="bg-gray-700 text-white font-semibold">
                            {referral.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {referral.full_name || referral.username}
                          </p>
                          <p className="text-sm text-gray-400">@{referral.username}</p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                          {formatDate(referral.created_at)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {referrals.length === 0 && (
              <div className="bg-black border border-gray-800 rounded-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">No referrals yet</h3>
                    <p className="text-gray-400">
                      Start sharing your referral code to invite friends and start earning!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Pro Modal */}
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
      />
      
      {/* Featured Token Modal */}
      <FeaturedTokenModal
        isOpen={showFeaturedTokenModal}
        onClose={() => setShowFeaturedTokenModal(false)}
        onSuccess={() => {
          setShowFeaturedTokenModal(false)
          // Refresh featured tokens or show success message
        }}
      />
      
      {/* Mobile Trending Modal */}
      <MobileTrendingModal
        isOpen={showTrendingModal}
        onClose={() => setShowTrendingModal(false)}
      />
      
      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        postId={selectedPostId || ''}
        onPromote={handlePromoteConfirm}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onPromoteClick={() => setShowFeaturedTokenModal(true)}
      />
    </div>
  )
}