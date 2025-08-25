'use client'

import { useAuth } from '@/contexts/AuthContext'
import EmailLinkSignIn from '@/components/EmailLinkSignIn'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      console.log('Attempting login with:', email) // Debug log
      await login(email, password)
      router.push('/') // Redirect to home page after successful login
    } catch (error: any) {
      console.error('Login error:', error) // Debug log
      setError('Failed to log in: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="my-16 flex justify-center">
        <Logo className="w-32" />
      </div>

      <div className="mx-auto max-w-md space-y-6">
        {/* Google Sign-In */}
        <GoogleSignInButton 
          onError={(error) => setError(error)}
          onSuccess={() => router.push('/')}
        />

        {/* OR Divider */}
        <div className="relative text-center">
          <span className="relative z-10 inline-block bg-white px-4 text-sm font-medium dark:bg-neutral-900 dark:text-neutral-400">
            OR
          </span>
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 border border-neutral-100 dark:border-neutral-800"></div>
        </div>

        {/* Login Method Tabs */}
        <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              loginMethod === 'password'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            🔐 Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('magic-link')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              loginMethod === 'magic-link'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            ✨ Magic Link
          </button>
        </div>

        {/* Login Forms */}
        {loginMethod === 'password' ? (
          <div className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Password Form */}
            <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
              <Field className="block">
                <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
                <Input
                  type="email"
                  placeholder="example@example.com"
                  className="mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field className="block">
                <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                  <Label>{T['login']['Password']}</Label>
                  <Link href="/forgot-password" className="text-sm font-medium underline">
                    {T['login']['Forgot password?']}
                  </Link>
                </div>
                <Input
                  type="password"
                  className="mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </ButtonPrimary>
            </form>
          </div>
        ) : (
          <EmailLinkSignIn />
        )}

        {/* ==== */}
        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          {T['login']['New user?']} {` `}
          <Link href="/signup" className="font-medium underline">
            {T['login']['Create an account']}
          </Link>
        </div>
      </div>
    </div>
  )
}