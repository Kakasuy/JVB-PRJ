'use client'

import { useAuth } from '@/contexts/AuthContext'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import FacebookSignInButton from '@/components/FacebookSignInButton'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function Page() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signup } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    if (!displayName.trim()) {
      return setError('Display name is required')
    }

    try {
      setError('')
      setLoading(true)
      await signup(email, password, displayName.trim())
      router.push('/') // Redirect to home page after successful signup
    } catch (error: any) {
      setError('Failed to create account: ' + error.message)
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
        {/* Social Sign-In Options */}
        <div className="space-y-3">
          <GoogleSignInButton 
            onError={(error) => setError(error)}
            onSuccess={() => router.push('/')}
          />
          <FacebookSignInButton 
            onError={(error) => setError(error)}
            onSuccess={() => router.push('/')}
          />
        </div>

        {/* OR Divider */}
        <div className="relative text-center">
          <span className="relative z-10 inline-block bg-white px-4 text-sm font-medium dark:bg-neutral-900 dark:text-neutral-400">
            OR
          </span>
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 transform border border-neutral-100 dark:border-neutral-800"></div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* FORM */}
        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          <Field className="block">
            <Label className="text-neutral-800 dark:text-neutral-200">Full Name</Label>
            <Input
              type="text"
              placeholder="John Doe"
              className="mt-1"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </Field>
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
            <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Password']}</Label>
            <Input
              type="password"
              className="mt-1"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Field className="block">
            <Label className="text-neutral-800 dark:text-neutral-200">Confirm Password</Label>
            <Input
              type="password"
              className="mt-1"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
          <ButtonPrimary type="submit" disabled={loading}>
            {loading ? 'Creating account...' : T['common']['Continue']}
          </ButtonPrimary>
        </form>

        {/* ==== */}
        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          {T['login']['Already have an account?']} {` `}
          <Link href="/login" className="font-medium underline">
            {T['login']['Sign in']}
          </Link>
        </div>
      </div>
    </div>
  )
}