export default function RefRedirectPage({ params }: { params: { code: string } }) {
  const { code } = params
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Referral Redirect</h1>
        <p className="mb-4">Referral code: {code}</p>
        <a 
          href={`/auth/signup?ref=${encodeURIComponent(code)}`}
          className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Go to Signup
        </a>
      </div>
    </div>
  )
}
