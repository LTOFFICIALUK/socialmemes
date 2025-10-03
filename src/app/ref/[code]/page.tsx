'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function RefRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (code) {
      setIsRedirecting(true)
      // Redirect to signup page with the referral code as a query parameter
      router.push(`/auth/signup?ref=${encodeURIComponent(code)}`)
    } else {
      setIsRedirecting(true)
      // If no code, redirect to signup page
      router.push('/auth/signup')
    }
  }, [code, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">
        {isRedirecting ? 'Redirecting...' : 'Loading...'}
        {code && <div className="text-sm text-gray-400 mt-2">Referral code: {code}</div>}
      </div>
    </div>
  )
}
