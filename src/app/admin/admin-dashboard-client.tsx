'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  Calendar, 
  Calculator, 
  Settings,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface RevenuePeriod {
  id: string
  period_start: string
  period_end: string
  pumpfun_fees_sol: number
  platform_revenue_sol: number
  pumpfun_pool_sol: number
  platform_pool_sol: number
  total_pool_sol: number
  pumpfun_creator_wallet?: string
  status: 'pending' | 'calculated' | 'paid'
  created_at: string
}

interface BiweeklyPeriod {
  id: string
  period_start: string
  period_end: string
  period_name: string
  year: number
  month: number
  period_number: number
  is_current: boolean
  is_future: boolean
  has_revenue_data: boolean
  revenue_status: string
  revenue_data?: RevenuePeriod | null
  created_at: string
}

interface PlatformRevenueBreakdown {
  proSubscriptions: number
  postPromotions: number
  featuredTokens: number
  total: number
}

interface CalculationResult {
  success: boolean
  period: { start: string; end: string }
  revenue: {
    pumpfunFees: number
    platformRevenue: number
    totalPool: number
  }
  eligibleUsers: number
  totalScore: number
  payouts: Array<{
    userId: string
    payout: number
    score: number
    interactions: {
      posts: number
      comments: number
      likes: number
      follows: number
    }
  }>
  referralBonuses: Array<{
    referrerId: string
    referredUserId: string
    bonus: number
    referredUserPayout: number
  }>
  summary: {
    totalPayoutAmount: number
    totalReferralBonuses: number
  }
}

export function AdminDashboardClient() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    pro?: boolean;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allPeriods, setAllPeriods] = useState<BiweeklyPeriod[]>([])
  const [currentPeriodData, setCurrentPeriodData] = useState<BiweeklyPeriod | null>(null)
  const [, setSelectedPeriod] = useState<BiweeklyPeriod | null>(null)
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformRevenueBreakdown | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSettingRevenue, setIsSettingRevenue] = useState(false)

  // Form state for setting revenue
  const [newRevenue, setNewRevenue] = useState({
    pumpfunCreatorWallet: '',
    platformRevenue: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchAllPeriods()
    fetchCurrentPeriod()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form fields when current period data changes
  useEffect(() => {
    if (currentPeriodData?.revenue_data) {
      setNewRevenue(prev => ({
        pumpfunCreatorWallet: currentPeriodData.revenue_data?.pumpfun_creator_wallet || '',
        platformRevenue: currentPeriodData.revenue_data?.platform_revenue_sol?.toString() || ''
      }))
    } else {
      // Reset form when no revenue data
      setNewRevenue({
        pumpfunCreatorWallet: '',
        platformRevenue: ''
      })
    }
  }, [currentPeriodData])

  // Auto-fetch PumpFun fees when wallet address is available but fees are 0
  useEffect(() => {
    const autoFetchPumpFunFees = async () => {
      if (currentPeriodData?.revenue_data?.pumpfun_creator_wallet && 
          currentPeriodData.revenue_data.pumpfun_fees_sol === 0) {
        
        try {
          const response = await fetch('/api/admin/revenue/fetch-pumpfun-fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: currentPeriodData.revenue_data.pumpfun_creator_wallet,
              periodStart: currentPeriodData.period_start,
              periodEnd: currentPeriodData.period_end
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Refresh the current period data to show updated fees
              fetchCurrentPeriod()
            }
          }
        } catch (error) {
          console.error('Failed to auto-fetch PumpFun fees:', error)
        }
      }
    }

    autoFetchPumpFunFees()
  }, [currentPeriodData?.revenue_data?.pumpfun_creator_wallet, currentPeriodData?.revenue_data?.pumpfun_fees_sol, currentPeriodData?.period_start, currentPeriodData?.period_end])

  const fetchAllPeriods = async () => {
    try {
      const response = await fetch('/api/admin/periods')
      const data = await response.json()
      
      if (data.success) {
        setAllPeriods(data.periods)
      }
    } catch (error) {
      console.error('Failed to fetch periods:', error)
    }
  }

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch('/api/admin/periods/current')
      const data = await response.json()
      
      if (data.success) {
        setCurrentPeriodData(data.currentPeriod)
      }
    } catch (error) {
      console.error('Failed to fetch current period:', error)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Check if user is admin (you can implement your own admin logic here)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, pro')
        .eq('id', user.id)
        .single()

      if (!profile?.pro) {
        router.push('/')
        return
      }

      setCurrentUser({ ...user, ...profile })
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/signin')
    } finally {
      setIsLoading(false)
    }
  }


  const calculatePlatformRevenue = async (periodStart?: string, periodEnd?: string) => {
    const start = periodStart || currentPeriodData?.period_start
    const end = periodEnd || currentPeriodData?.period_end
    
    if (!start || !end) return
    
    try {
      const response = await fetch('/api/admin/revenue/calculate-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: start, periodEnd: end })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPlatformBreakdown(data.breakdown)
        setNewRevenue(prev => ({ ...prev, platformRevenue: data.breakdown.total.toString() }))
      }
    } catch (error) {
      console.error('Failed to calculate platform revenue:', error)
    }
  }

  const setRevenueData = async () => {
    if (!currentPeriodData || !newRevenue.pumpfunCreatorWallet || !newRevenue.platformRevenue) {
      alert('Please fill in all fields')
      return
    }

    setIsSettingRevenue(true)
    try {
      const response = await fetch('/api/admin/revenue/set-biweekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: currentPeriodData.period_start,
          periodEnd: currentPeriodData.period_end,
          pumpfunCreatorWallet: newRevenue.pumpfunCreatorWallet,
          platformRevenue: parseFloat(newRevenue.platformRevenue)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Revenue data set successfully!')
        setNewRevenue({ pumpfunCreatorWallet: '', platformRevenue: '' })
        setPlatformBreakdown(null)
        fetchAllPeriods()
        fetchCurrentPeriod()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to set revenue data:', error)
      alert('Failed to set revenue data')
    } finally {
      setIsSettingRevenue(false)
    }
  }

  const calculatePayouts = async (period: BiweeklyPeriod) => {
    setIsCalculating(true)
    setSelectedPeriod(period)
    try {
      const response = await fetch('/api/revenue/calculate-biweekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: period.period_start,
          periodEnd: period.period_end
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCalculationResult(data)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to calculate payouts:', error)
      alert('Failed to calculate payouts')
    } finally {
      setIsCalculating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'calculated':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(4)} SOL`
  }

  const categorizePeriods = () => {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    
    const past = allPeriods.filter(period => period.period_end < currentDate)
    const current = allPeriods.filter(period => 
      period.period_start <= currentDate && period.period_end >= currentDate
    )
    const future = allPeriods.filter(period => period.period_start > currentDate)
    
    return { past, current, future }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">Revenue Sharing Management</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Welcome, {currentUser?.username}</p>
            <p className="text-xs text-gray-500">Admin Access</p>
          </div>
        </div>

        {/* Current Period Section */}
        {currentPeriodData && (
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {currentPeriodData.period_name}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Period Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Period Details</h3>
                <p className="text-sm text-gray-300">
                  {formatDate(currentPeriodData.period_start)} - {formatDate(currentPeriodData.period_end)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {currentPeriodData.has_revenue_data ? 
                    `Revenue data set (${currentPeriodData.revenue_status})` : 
                    'No revenue data yet'
                  }
                </p>
                {currentPeriodData.revenue_data && (
                  <div className="mt-2 text-xs">
                    <p>PumpFun: {formatSOL(currentPeriodData.revenue_data.pumpfun_fees_sol)}</p>
                    {currentPeriodData.revenue_data.pumpfun_creator_wallet && (
                      <p className="text-gray-400">Wallet: {currentPeriodData.revenue_data.pumpfun_creator_wallet.slice(0, 8)}...{currentPeriodData.revenue_data.pumpfun_creator_wallet.slice(-6)}</p>
                    )}
                    <p>Platform: {formatSOL(currentPeriodData.revenue_data.platform_revenue_sol)}</p>
                    <p>Total Pool: {formatSOL(currentPeriodData.revenue_data.total_pool_sol)}</p>
                  </div>
                )}
              </div>

              {/* Revenue Input */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Set Revenue</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">PumpFun Creator Wallet</label>
                    <Input
                      type="text"
                      placeholder="Enter PumpFun Creator Wallet Address"
                      value={newRevenue.pumpfunCreatorWallet}
                      onChange={(e) => setNewRevenue(prev => ({ ...prev, pumpfunCreatorWallet: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">Platform Revenue (SOL)</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => calculatePlatformRevenue()}
                        className="text-xs h-6 px-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Auto
                      </Button>
                    </div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={newRevenue.platformRevenue}
                      onChange={(e) => setNewRevenue(prev => ({ ...prev, platformRevenue: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={setRevenueData}
                    disabled={isSettingRevenue || !newRevenue.pumpfunCreatorWallet || !newRevenue.platformRevenue}
                    className="w-full"
                  >
                    {isSettingRevenue ? 'Setting Revenue...' : 'Set Revenue Data'}
                  </Button>
                  {currentPeriodData.has_revenue_data && (
                    <Button
                      variant="outline"
                      onClick={() => calculatePayouts(currentPeriodData)}
                      disabled={isCalculating}
                      className="w-full"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Payouts
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {platformBreakdown && (
              <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Platform Revenue Breakdown:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Pro Subscriptions</p>
                    <p className="font-medium">{formatSOL(platformBreakdown.proSubscriptions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Post Promotions</p>
                    <p className="font-medium">{formatSOL(platformBreakdown.postPromotions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Featured Tokens</p>
                    <p className="font-medium">{formatSOL(platformBreakdown.featuredTokens)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total</p>
                    <p className="font-medium text-green-400">{formatSOL(platformBreakdown.total)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Past Periods */}
          <div className="space-y-6">
            {/* Past Periods */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Past Periods
              </h2>
              
              <div className="space-y-3">
                {categorizePeriods().past.length === 0 ? (
                  <p className="text-gray-400 text-sm">No past periods yet</p>
                ) : (
                  categorizePeriods().past.map((period) => (
                    <div key={period.id} className="bg-gray-800 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(period.revenue_status)}
                          <div>
                            <span className="font-medium text-sm">{period.period_name}</span>
                            <p className="text-xs text-gray-400">
                              {formatDate(period.period_start)} - {formatDate(period.period_end)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => calculatePayouts(period)}
                          disabled={isCalculating}
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                      {period.has_revenue_data && period.revenue_data ? (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <p>PumpFun: {formatSOL(period.revenue_data.pumpfun_fees_sol)}</p>
                            {period.revenue_data.pumpfun_creator_wallet && (
                              <p className="text-gray-400 text-xs">Wallet: {period.revenue_data.pumpfun_creator_wallet.slice(0, 6)}...{period.revenue_data.pumpfun_creator_wallet.slice(-4)}</p>
                            )}
                            <p>Platform: {formatSOL(period.revenue_data.platform_revenue_sol)}</p>
                          </div>
                          <div>
                            <p>Total Pool: {formatSOL(period.revenue_data.total_pool_sol)}</p>
                            <p className="capitalize">{period.revenue_status}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No revenue data</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Future Periods & Results */}
          <div className="space-y-6">
            {/* Future Periods */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Future Periods
              </h2>
              
              <div className="space-y-3">
                {categorizePeriods().future.length === 0 ? (
                  <p className="text-gray-400 text-sm">No future periods yet</p>
                ) : (
                  categorizePeriods().future.map((period) => (
                    <div key={period.id} className="bg-gray-800 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(period.revenue_status)}
                          <div>
                            <span className="font-medium text-sm">{period.period_name}</span>
                            <p className="text-xs text-gray-400">
                              {formatDate(period.period_start)} - {formatDate(period.period_end)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => calculatePayouts(period)}
                          disabled={isCalculating}
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                      {period.has_revenue_data && period.revenue_data ? (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <p>PumpFun: {formatSOL(period.revenue_data.pumpfun_fees_sol)}</p>
                            {period.revenue_data.pumpfun_creator_wallet && (
                              <p className="text-gray-400 text-xs">Wallet: {period.revenue_data.pumpfun_creator_wallet.slice(0, 6)}...{period.revenue_data.pumpfun_creator_wallet.slice(-4)}</p>
                            )}
                            <p>Platform: {formatSOL(period.revenue_data.platform_revenue_sol)}</p>
                          </div>
                          <div>
                            <p>Total Pool: {formatSOL(period.revenue_data.total_pool_sol)}</p>
                            <p className="capitalize">{period.revenue_status}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No revenue data</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculation Results */}
            {calculationResult && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Calculation Results
                </h2>
                
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-800 rounded p-4">
                    <h3 className="font-medium mb-3">Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Eligible Users</p>
                        <p className="font-medium">{calculationResult.eligibleUsers}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Score</p>
                        <p className="font-medium">{calculationResult.totalScore.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Payout</p>
                        <p className="font-medium">{formatSOL(calculationResult.summary.totalPayoutAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Referral Bonuses</p>
                        <p className="font-medium">{formatSOL(calculationResult.summary.totalReferralBonuses)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Payouts */}
                  <div className="bg-gray-800 rounded p-4">
                    <h3 className="font-medium mb-3">Top Payouts</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {calculationResult.payouts
                        .sort((a, b) => b.payout - a.payout)
                        .slice(0, 10)
                        .map((payout, index) => (
                          <div key={payout.userId} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="text-gray-400">#{index + 1}</span>
                              <span className="ml-2 font-medium">{formatSOL(payout.payout)}</span>
                            </div>
                            <div className="text-gray-400 text-xs">
                              Score: {payout.score.toFixed(1)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Referral Bonuses */}
                  {calculationResult.referralBonuses.length > 0 && (
                    <div className="bg-gray-800 rounded p-4">
                      <h3 className="font-medium mb-3">Referral Bonuses</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {calculationResult.referralBonuses.map((bonus, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Referrer Bonus</span>
                            <span className="font-medium">{formatSOL(bonus.bonus)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Period Management */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Period Management
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-medium mb-2">Generate Periods</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Generate bi-weekly periods for a specific year
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const currentYear = new Date().getFullYear()
                      const nextYear = currentYear + 1
                      
                      try {
                        // Generate for current year
                        await fetch('/api/admin/periods', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'generate_year', year: currentYear })
                        })
                        
                        // Generate for next year
                        await fetch('/api/admin/periods', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'generate_year', year: nextYear })
                        })
                        
                        // Update status flags
                        await fetch('/api/admin/periods', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'update_status_flags' })
                        })
                        
                        alert(`Generated periods for ${currentYear} and ${nextYear}`)
                        fetchAllPeriods()
                        fetchCurrentPeriod()
                      } catch (error) {
                        console.error('Failed to generate periods:', error)
                        alert('Failed to generate periods')
                      }
                    }}
                  >
                    Generate {new Date().getFullYear()} & {new Date().getFullYear() + 1}
                  </Button>
                </div>

                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-medium mb-2">Update Status Flags</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Update current and future period flags
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await fetch('/api/admin/periods', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'update_status_flags' })
                        })
                        
                        alert('Status flags updated')
                        fetchAllPeriods()
                        fetchCurrentPeriod()
                      } catch (error) {
                        console.error('Failed to update status flags:', error)
                        alert('Failed to update status flags')
                      }
                    }}
                  >
                    Update Flags
                  </Button>
                </div>

                <div className="bg-gray-800 rounded p-4">
                  <h3 className="font-medium mb-2">Test Notifications</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Send mock payout notifications to all users for testing
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!confirm('This will send test payout notifications to ALL users. Continue?')) {
                        return
                      }
                      
                      try {
                        const response = await fetch('/api/admin/test-notifications', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            action: 'send_mock_notifications',
                            periodStart: currentPeriodData?.period_start || '2025-10-01',
                            periodEnd: currentPeriodData?.period_end || '2025-10-14'
                          })
                        })
                        
                        const result = await response.json()
                        
                        if (result.success) {
                          alert(`Sent ${result.notificationsSent} test notifications successfully!`)
                        } else {
                          alert(`Failed: ${result.error}`)
                        }
                      } catch (error) {
                        console.error('Failed to send test notifications:', error)
                        alert('Failed to send test notifications')
                      }
                    }}
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    🧪 Send Test Notifications
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Instructions
              </h2>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <p className="font-medium text-white">1. Generate Periods</p>
                  <p>First, generate bi-weekly periods for the current and next year.</p>
                </div>
                <div>
                  <p className="font-medium text-white">2. Set Revenue Data</p>
                  <p>Enter PumpFun fees and platform revenue for the current period.</p>
                </div>
                <div>
                  <p className="font-medium text-white">3. Calculate Payouts</p>
                  <p>Click &quot;Calculate&quot; to determine user payouts based on interactions.</p>
                </div>
                <div>
                  <p className="font-medium text-white">4. Review Results</p>
                  <p>Check the calculation results before processing payments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
