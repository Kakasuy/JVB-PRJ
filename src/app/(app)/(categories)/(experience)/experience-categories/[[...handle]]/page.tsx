import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { ExperiencesSearchForm } from '@/components/HeroSearchForm/ExperiencesSearchForm'
import { ExperienceSearchResults } from '@/components/ExperienceSearchResults'
import ListingFilterTabs from '@/components/ListingFilterTabs'
import SectionSliderCards from '@/components/SectionSliderCards'
import { getExperienceCategoryByHandle } from '@/data/categories'
import { getExperienceListingFilterOptions, getExperienceListings } from '@/data/listings'
import { Button } from '@/shared/Button'
import { Divider } from '@/shared/divider'
import { Heading } from '@/shared/Heading'
import convertNumbThousand from '@/utils/convertNumbThousand'
import { HotAirBalloonIcon, MapPinpoint02Icon, MapsLocation01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

// No server-side functions needed - moved to client-side component

export async function generateMetadata({ params }: { params: Promise<{ handle?: string[] }> }): Promise<Metadata> {
  const { handle } = await params
  const category = await getExperienceCategoryByHandle(handle?.[0])
  if (!category) {
    return {
      title: 'Collection not found',
      description: 'The collection you are looking for does not exist.',
    }
  }
  const { name, description } = category
  return { title: name, description }
}

const Page = async ({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ handle?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { handle } = await params
  const urlSearchParams = await searchParams

  const category = await getExperienceCategoryByHandle(handle?.[0])
  const filterOptions = await getExperienceListingFilterOptions()
  
  // Extract search params for client component
  const geoCode = urlSearchParams.geoCode as string
  const location = urlSearchParams.location as string

  if (!category?.id) {
    return redirect('/experience-categories/all')
  }

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading={category.name}
          image={category.coverImage}
          imageAlt={category.name}
          searchForm={<ExperiencesSearchForm formStyle="default" />}
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{category.region} </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={HotAirBalloonIcon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{convertNumbThousand(category.count)} experiences</span>
            </div>
          }
        />
      </div>

      <div className="relative container mt-14 lg:mt-24">
        {/* start heading */}
        <div className="flex flex-wrap items-end justify-between gap-x-2.5 gap-y-5">
          <h2 id="heading" className="scroll-mt-20 text-lg font-semibold sm:text-xl">
            Explore experiences
            {category.handle !== 'all' ? ` in ${category.name}` : null}
          </h2>
          <Button color="white" className="ms-auto" href={'/experience-categories-map/' + category.handle}>
            <span className="me-1">Show map</span>
            <HugeiconsIcon icon={MapsLocation01Icon} size={20} color="currentColor" strokeWidth={1.5} />
          </Button>
        </div>
        <Divider className="my-8 md:mb-12" />
        {/* end heading */}
        
        <ListingFilterTabs filterOptions={filterOptions} />

        {/* Client-side search results */}
        <ExperienceSearchResults geoCode={geoCode} location={location} />
      </div>
    </div>
  )
}

export default Page
