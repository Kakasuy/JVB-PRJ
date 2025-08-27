import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import TransferDetailClient from './TransferDetailClient'


export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  
  // Since we can't access sessionStorage in SSR, use generic metadata
  return {
    title: 'Transfer Details',
    description: 'View detailed information about your transfer booking.',
  }
}

const Page = async ({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) => {
  const { id } = await params

  // Server action to handle booking form submission
  async function handleBookingSubmit(formData: FormData) {
    'use server'
    
    console.log('Transfer booking submitted:', Object.fromEntries(formData.entries()))
    // Redirect to transfer checkout or booking confirmation
    redirect('/car-checkout')
  }

  return <TransferDetailClient />
}

export default Page