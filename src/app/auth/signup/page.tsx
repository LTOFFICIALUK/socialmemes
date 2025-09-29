'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({})
  const [usernameError, setUsernameError] = useState('')
  const router = useRouter()

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim()) {
      setUsernameError('')
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', usernameToCheck.trim())
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        setUsernameError('')
      } else if (data) {
        setUsernameError('This username is already taken')
      }
    } catch {
      // Ignore errors for now - we'll handle them on form submission
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    setUsernameError('')
    setValidationErrors({})

    // Validate required fields
    const errors: {[key: string]: boolean} = {}
    if (!username.trim()) errors.username = true
    if (!email.trim()) errors.email = true
    if (!password.trim()) errors.password = true

    if (Object.keys(errors).length > 0 || usernameError) {
      setValidationErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/signin`
        }
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('duplicate key value') || error.message.includes('unique constraint')) {
          setError('This username is already taken. Please choose a different username.')
        } else if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.')
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.')
        } else {
          setError(error.message)
        }
      } else {
        // Show success message
        setSuccess('Account created successfully! Please check your email to verify your account.')
        // Clear form
        setEmail('')
        setPassword('')
        setUsername('')
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Join $MEMES
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link href="/auth/signin" className="font-medium text-green-400 hover:text-green-300">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (validationErrors.username) {
                    setValidationErrors(prev => ({...prev, username: false}))
                  }
                  // Check username availability after a short delay
                  const timeoutId = setTimeout(() => {
                    checkUsernameAvailability(e.target.value)
                  }, 500)
                  return () => clearTimeout(timeoutId)
                }}
                className={`mt-1 border-gray-700 focus-visible:border-gray-600 ${validationErrors.username || usernameError ? 'border-red-500' : ''}`}
                placeholder="Choose a username"
              />
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-500">Username is required</p>
              )}
              {usernameError && (
                <p className="mt-1 text-sm text-red-500">{usernameError}</p>
              )}
            </div>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({...prev, password: false}))
                  }
                }}
                className={`mt-1 border-gray-700 focus-visible:border-gray-600 ${validationErrors.password ? 'border-red-500' : ''}`}
                placeholder="Create a password"
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
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  )
}
