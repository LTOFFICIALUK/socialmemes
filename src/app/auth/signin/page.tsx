'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user came from email confirmation
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      setSuccess('Email confirmed successfully! You can now sign in to your account.')
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session')
      if (event === 'SIGNED_IN' && session) {
        console.log('Redirecting to home page...')
        setIsLoading(false)
        router.push('/')
      } else if (event === 'SIGNED_OUT') {
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    setValidationErrors({})

    // Validate required fields
    const errors: {[key: string]: boolean} = {}
    if (!email.trim()) errors.email = true
    if (!password.trim()) errors.password = true

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      console.log('Attempting to sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in result:', { data, error })

      if (error) {
        console.log('Sign in error:', error)
        setError(error.message)
        setIsLoading(false)
      } else {
        console.log('Sign in successful, waiting for auth state change...')
        // Don't set loading to false here - let the auth state change handle it
      }
    } catch (err) {
      console.log('Sign in exception:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to $MEMES
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-green-400 hover:text-green-300">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (validationErrors.email) {
                    setValidationErrors(prev => ({...prev, email: false}))
                  }
                }}
                className={`mt-1 border-gray-700 focus-visible:border-gray-600 ${validationErrors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-500">Email address is required</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({...prev, password: false}))
                  }
                }}
                className={`mt-1 border-gray-700 focus-visible:border-gray-600 ${validationErrors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-500">Password is required</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {success && (
            <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-800 rounded-md p-3">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full border border-gray-600 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
