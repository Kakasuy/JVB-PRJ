'use client'

import { useAuth } from '@/contexts/AuthContext'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import { FormEvent, useState } from 'react'

interface Props {
  className?: string
}

export default function EmailLinkSignIn({ className = '' }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { sendMagicLink } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      await sendMagicLink(email)
      setSuccess(true)
    } catch (error: any) {
      setError('Failed to send magic link: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={className}>
        <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <svg className="size-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
            Check your email!
          </h3>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Click the link in your email to sign in instantly
          </p>
          <button
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="mt-4 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            Send to different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Sign in with Magic Link
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No password required. We'll send you a secure link.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label className="text-neutral-800 dark:text-neutral-200">Email address</Label>
            <Input
              type="email"
              placeholder="example@example.com"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          
          <ButtonPrimary type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending magic link...' : 'Send Magic Link'}
          </ButtonPrimary>
        </form>

        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          The link will be valid for 15 minutes
        </div>
      </div>
    </div>
  )
}