import { redirect } from 'next/navigation'

export default function RefRedirectPage({ params }: { params: { code: string } }) {
  const { code } = params
  
  // Automatically redirect to signup page with referral code
  redirect(`/auth/signup?ref=${encodeURIComponent(code)}`)
}
