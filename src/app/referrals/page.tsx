import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { ReferralsClient } from './referrals-client'

export default async function ReferralsPage() {
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Get user profile with referral data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, referral_code, referral_link')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/signin')
  }

  // Get referral statistics
  const { data: stats } = await supabase
    .rpc('get_referral_stats', { user_id: user.id })

  // Get recent referrals
  const { data: referrals } = await supabase
    .rpc('get_user_referrals', { user_id: user.id, limit_count: 20, offset_count: 0 })

  return (
    <ReferralsClient 
      profile={profile}
      stats={stats?.[0] || { total_referrals: 0, recent_referrals: 0 }}
      referrals={referrals || []}
    />
  )
}
