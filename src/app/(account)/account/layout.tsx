import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Page',
  description: 'Manage your account information and profile settings',
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}