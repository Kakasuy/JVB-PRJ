import { Calendar01Icon, Comment01Icon } from '@/components/Icons'
import ListingReview from '@/components/ListingReview'
import StartRating from '@/components/StartRating'
import { getAuthorByHandle } from '@/data/authors'
import { getListingReviews } from '@/data/data'
import Avatar from '@/shared/Avatar'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import SocialsList from '@/shared/SocialsList'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Award04Icon, Flag03Icon, Medal01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListingTabs from './ListingTabs'
import UserBookingsPage from './UserBookingsPage'

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const author = await getAuthorByHandle(handle)

  if (!author?.id) {
    return {
      title: 'Author not found',
      description: 'The author you are looking for does not exist.',
    }
  }

  return {
    title: `${author.displayName} - Author Profile`,
    description: `Explore the profile of ${author.displayName}, a top-rated host with ${author.reviewsCount} reviews and a star rating of ${author.starRating}. Discover their listings and read reviews from guests.`,
  }
}

const Page = async ({ params }: { params: Promise<{ handle: string }> }) => {
  const { handle } = await params

  const reviews = await getListingReviews(handle)
  const author = await getAuthorByHandle(handle)

  if (!author?.id) {
    return notFound()
  }

  const { displayName, avatarUrl, count, description, starRating, address, languages, joinedDate, reviewsCount } =
    author

  const renderSidebar = () => {
    const AuthorSidebar = require('./AuthorSidebar').default
    
    return (
      <AuthorSidebar 
        author={author}
        handle={handle}
        displayName={displayName}
        avatarUrl={avatarUrl}
        count={count}
        description={description}
        starRating={starRating}
        address={address}
        languages={languages}
        joinedDate={joinedDate}
        reviewsCount={reviewsCount}
      />
    )
  }

  const renderSectionListings = () => {
    return (
      <UserBookingsPage 
        handle={handle}
        displayName={displayName}
        author={author}
      />
    )
  }

  const renderSectionReviews = () => {
    return (
      <div className="listingSection__wrap">
        {/* HEADING */}
        <h2 className="text-2xl font-semibold">What guests are saying about {displayName}</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* comment */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {reviews.map((review) => (
            <ListingReview key={review.id} className="py-8 first:pt-0 last:pb-0" reivew={review} />
          ))}

          <div className="pt-8">
            <ButtonSecondary>View more 20 reviews</ButtonSecondary>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <main className="container mt-12 mb-24 flex flex-col lg:mb-32 lg:flex-row">
        <div className="mb-24 block grow lg:mb-0">
          <div className="lg:sticky lg:top-5">{renderSidebar()}</div>
        </div>
        <div className="w-full shrink-0 space-y-8 lg:w-3/5 lg:space-y-10 lg:ps-10 xl:w-2/3">
          {renderSectionListings()}
          {renderSectionReviews()}
        </div>
      </main>
    </div>
  )
}

export default Page
