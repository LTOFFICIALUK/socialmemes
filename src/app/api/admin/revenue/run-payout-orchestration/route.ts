import { NextRequest, NextResponse } from 'next/server'
import { validatePeriod, getCurrentProcessablePeriod } from '@/lib/period-utils'

export async function GET() {
  return NextResponse.json({
    message: "Payout Orchestration API",
    method: "This endpoint only accepts POST requests",
    usage: "Send a POST request with optional periodStart and periodEnd in the request body",
    example: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_SECRET_KEY"
      },
      body: {
        periodStart: "2024-01-01",
        periodEnd: "2024-01-15"
      }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key for security
    const authHeader = request.headers.get('authorization')
    const expectedApiKey = process.env.API_SECRET_KEY
    
    if (expectedApiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== expectedApiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    const { periodStart, periodEnd } = await request.json()

    // If no period provided, get the current processable period
    let finalPeriodStart = periodStart
    let finalPeriodEnd = periodEnd

    if (!periodStart || !periodEnd) {
      console.log('No period provided, getting current processable period...')
      const currentPeriodResult = await getCurrentProcessablePeriod()
      
      if (!currentPeriodResult.isValid || !currentPeriodResult.period) {
        return NextResponse.json(
          { error: currentPeriodResult.error || 'No processable period found' },
          { status: 400 }
        )
      }

      finalPeriodStart = currentPeriodResult.period.period_start
      finalPeriodEnd = currentPeriodResult.period.period_end
    }

    // Validate the period using our standardized validation
    console.log(`Validating period: ${finalPeriodStart} to ${finalPeriodEnd}`)
    const validationResult = await validatePeriod(finalPeriodStart, finalPeriodEnd)
    
    if (!validationResult.isValid || !validationResult.period) {
      return NextResponse.json(
        { error: validationResult.error || 'Period validation failed' },
        { status: 400 }
      )
    }

    const periodData = validationResult.period

    const orchestrationResults = {
      period: { start: finalPeriodStart, end: finalPeriodEnd },
      steps: [] as Array<{
        step: number;
        name: string;
        success: boolean;
        data?: Record<string, unknown>;
        error?: string;
      }>,
      success: false,
      errors: [] as string[]
    }

    // Step 1: Period validated and data retrieved
    console.log('Step 1: Period validated and data retrieved...')

    orchestrationResults.steps.push({
      step: 1,
      name: 'Period Validation',
      success: true,
      data: {
        periodName: periodData.period_name,
        pumpfunCreatorWallet: periodData.pumpfun_creator_wallet,
        currentRevenueStatus: periodData.revenue_status,
        isCurrent: periodData.is_current,
        isFuture: periodData.is_future
      }
    })

    // Step 2: Calculate user interaction scores
    console.log('Step 2: Calculating user interaction scores...')
    try {
      const interactionResponse = await fetch(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/revenue/period-interaction-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: finalPeriodStart, periodEnd: finalPeriodEnd })
      })

      const interactionData = await interactionResponse.json()

      if (!interactionResponse.ok || !interactionData.success) {
        throw new Error(interactionData.error || 'Failed to calculate interaction scores')
      }

      orchestrationResults.steps.push({
        step: 2,
        name: 'Calculate Interaction Scores',
        success: true,
        data: {
          processedUsers: interactionData.summary?.processedUsers || 0,
          totalProUsers: interactionData.summary?.totalProUsers || 0,
          errors: interactionData.summary?.errors || 0
        }
      })
    } catch (error) {
      const errorMsg = `Step 2 failed: ${error}`
      orchestrationResults.errors.push(errorMsg)
      orchestrationResults.steps.push({
        step: 2,
        name: 'Calculate Interaction Scores',
        success: false,
        error: errorMsg
      })
      return NextResponse.json({
        ...orchestrationResults,
        error: errorMsg
      }, { status: 500 })
    }

    // Step 3a: Calculate PumpFun period fees
    console.log('Step 3a: Calculating PumpFun period fees...')
    try {
      const pumpfunResponse = await fetch(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/revenue/pumpfun-period-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: periodData.pumpfun_creator_wallet,
          periodStart: finalPeriodStart,
          periodEnd: finalPeriodEnd
        })
      })

      const pumpfunData = await pumpfunResponse.json()

      if (!pumpfunResponse.ok || !pumpfunData.success) {
        throw new Error(pumpfunData.error || 'Failed to calculate PumpFun fees')
      }

      orchestrationResults.steps.push({
        step: 3,
        name: 'Calculate PumpFun Period Fees',
        success: true,
        data: {
          pumpfunFees: pumpfunData.pumpfunFees,
          pumpfunPool: pumpfunData.pumpfunPool,
          platformPool: pumpfunData.platformPool,
          totalPool: pumpfunData.totalPool
        }
      })
    } catch (error) {
      const errorMsg = `Step 3a failed: ${error}`
      orchestrationResults.errors.push(errorMsg)
      orchestrationResults.steps.push({
        step: 3,
        name: 'Calculate PumpFun Period Fees',
        success: false,
        error: errorMsg
      })
      return NextResponse.json({
        ...orchestrationResults,
        error: errorMsg
      }, { status: 500 })
    }

    // Step 3b: Calculate platform period fees
    console.log('Step 3b: Calculating platform period fees...')
    try {
      const platformResponse = await fetch(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/revenue/platform-period-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: finalPeriodStart, periodEnd: finalPeriodEnd })
      })

      const platformData = await platformResponse.json()

      if (!platformResponse.ok || !platformData.success) {
        throw new Error(platformData.error || 'Failed to calculate platform fees')
      }

      orchestrationResults.steps.push({
        step: 3,
        name: 'Calculate Platform Period Fees',
        success: true,
        data: {
          featuredTokensRevenue: platformData.breakdown?.featuredTokens?.revenue || 0,
          proSubscriptionsRevenue: platformData.breakdown?.proSubscriptions?.revenue || 0,
          totalPlatformRevenue: platformData.breakdown?.total || 0,
          platformPool: platformData.breakdown?.platformPool || 0,
          totalPool: platformData.breakdown?.totalPool || 0
        }
      })
    } catch (error) {
      const errorMsg = `Step 3b failed: ${error}`
      orchestrationResults.errors.push(errorMsg)
      orchestrationResults.steps.push({
        step: 3,
        name: 'Calculate Platform Period Fees',
        success: false,
        error: errorMsg
      })
      return NextResponse.json({
        ...orchestrationResults,
        error: errorMsg
      }, { status: 500 })
    }


    // Step 4: Calculate user payouts
    console.log('Step 4: Calculating user payouts...')
    try {
      const payoutsResponse = await fetch(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/revenue/user-payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: finalPeriodStart, periodEnd: finalPeriodEnd })
      })

      const payoutsData = await payoutsResponse.json()

      if (!payoutsResponse.ok || !payoutsData.success) {
        throw new Error(payoutsData.error || 'Failed to calculate user payouts')
      }

      orchestrationResults.steps.push({
        step: 4,
        name: 'Calculate User Payouts',
        success: true,
        data: {
          totalUsers: payoutsData.payoutSummary?.totalUsers || 0,
          totalScore: payoutsData.payoutSummary?.totalScore || 0,
          totalCalculatedPayout: payoutsData.payoutSummary?.totalCalculatedPayout || 0,
          isBalanced: payoutsData.payoutSummary?.verification?.isBalanced || false
        }
      })

      orchestrationResults.success = true

      return NextResponse.json({
        ...orchestrationResults,
        finalResults: {
          totalPool: payoutsData.revenueData?.totalPool || 0,
          totalUsers: payoutsData.payoutSummary?.totalUsers || 0,
          totalPayout: payoutsData.payoutSummary?.totalCalculatedPayout || 0,
          isBalanced: payoutsData.payoutSummary?.verification?.isBalanced || false
        },
        message: `Successfully completed payout orchestration for period ${finalPeriodStart} to ${finalPeriodEnd}. ${payoutsData.payoutSummary?.totalUsers || 0} users ready for payout.`
      })

    } catch (error) {
      const errorMsg = `Step 4 failed: ${error}`
      orchestrationResults.errors.push(errorMsg)
      orchestrationResults.steps.push({
        step: 4,
        name: 'Calculate User Payouts',
        success: false,
        error: errorMsg
      })
      return NextResponse.json({
        ...orchestrationResults,
        error: errorMsg
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Orchestration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during orchestration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
