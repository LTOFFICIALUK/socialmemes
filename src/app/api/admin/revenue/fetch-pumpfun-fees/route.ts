import { NextRequest, NextResponse } from 'next/server'

interface PumpFunFeeData {
  bucket: string
  creatorFee: string
  creatorFeeSOL: string
  numTrades: number
  cumulativeCreatorFee: string
  cumulativeCreatorFeeSOL: string
}

async function fetchAllTimePumpFunFees(creatorWallet: string): Promise<PumpFunFeeData[] | null> {
  try {
    const response = await fetch(
      `https://swap-api.pump.fun/v1/creators/${creatorWallet}/fees?interval=24h&limit=1000`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`PumpFun API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: PumpFunFeeData[] = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching PumpFun fees:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    // Validate input
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required field: walletAddress' },
        { status: 400 }
      )
    }

    // Validate wallet address format (basic validation for Solana addresses)
    // Solana addresses can be 32-44 characters long
    if (walletAddress.length < 32 || walletAddress.length > 44 || !/^[A-Za-z0-9]+$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Fetch all-time PumpFun fees from their API
    const allTimeFees = await fetchAllTimePumpFunFees(walletAddress)
    
    if (allTimeFees === null) {
      return NextResponse.json(
        { error: 'Failed to fetch PumpFun fees from API' },
        { status: 500 }
      )
    }

    // Calculate total all-time fees
    const totalAllTimeFees = allTimeFees.reduce((total, feeData) => {
      return total + parseFloat(feeData.creatorFeeSOL)
    }, 0)

    return NextResponse.json({
      success: true,
      allTimeFees,
      totalAllTimeFees,
      message: `Successfully fetched all-time PumpFun fees: ${totalAllTimeFees.toFixed(4)} SOL`
    })

  } catch (error) {
    console.error('Error fetching PumpFun fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
