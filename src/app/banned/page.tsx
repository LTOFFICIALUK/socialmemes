'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function BannedPage() {
  const router = useRouter()
  const [banInfo, setBanInfo] = useState<{
    reason: string | null
    moderatedAt: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/signin')
          return
        }

        // Get user's ban information
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('moderation_status, moderation_reason, moderated_at')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching ban info:', error)
          return
        }

        if (profile?.moderation_status === 'banned') {
          setBanInfo({
            reason: profile.moderation_reason,
            moderatedAt: profile.moderated_at
          })
        } else {
          // User is not banned, redirect to home
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking ban status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkBanStatus()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!banInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Account Suspended
          </h1>
          <p className="text-gray-400">
            Your account has been banned from this platform.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h3 className="text-white font-semibold mb-2">Reason for Ban:</h3>
          <p className="text-gray-300 text-sm">
            {banInfo.reason || 'No reason provided'}
          </p>
          {banInfo.moderatedAt && (
            <p className="text-gray-400 text-xs mt-2">
              Banned on: {new Date(banInfo.moderatedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-4">
            If you believe this ban was issued in error, you can contact our support team on Telegram.
          </p>
          <Button
            variant="outline"
            className="w-full mb-3 border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => window.open('https://t.me/socialmemesfun', '_blank')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <Button
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
            onClick={handleSignOut}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
