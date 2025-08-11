import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { StaySearchForm } from '@/components/HeroSearchForm/StaySearchForm'
import ListingFilterTabs from '@/components/ListingFilterTabs'
import { HotelSearchResults } from '@/components/HotelSearchResults'
import { getStayCategoryByHandle } from '@/data/categories'
import { getStayListingFilterOptions, getStayListings } from '@/data/listings'
import { Button } from '@/shared/Button'
import { Divider } from '@/shared/divider'
import convertNumbThousand from '@/utils/convertNumbThousand'
import { House04Icon, MapPinpoint02Icon, MapsLocation01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ handle?: string[] }> }): Promise<Metadata> {
  const { handle } = await params
  const category = await getStayCategoryByHandle(handle?.[0])
  if (!category) {
    return {
      title: 'Collection not found',
      description: 'The collection you are looking for does not exist.',
    }
  }
  const { name, description } = category
  return { title: name, description }
}

const Page = async ({ params }: { params: Promise<{ handle?: string[] }> }) => {
  const { handle } = await params

  const category = await getStayCategoryByHandle(handle?.[0])
  const listings = await getStayListings()
  const filterOptions = await getStayListingFilterOptions()

  if (!category?.id) {
    return redirect('/stay-categories/all')
  }

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading={category.name}
          image={category.coverImage}
          imageAlt={category.name}
          searchForm={<StaySearchForm formStyle="default" />}
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{category.region} </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={House04Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{convertNumbThousand(category.count)} stays</span>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="relative container mt-14 lg:mt-24">
        {/* start heading */}
        <div className="flex flex-wrap items-end justify-between gap-x-2.5 gap-y-5">
          <h2 id="heading" className="scroll-mt-20 text-lg font-semibold sm:text-xl">
            Over {convertNumbThousand(category.count)} places
            {category.handle !== 'all' ? ` in ${category.name}` : null}
          </h2>
          <Button color="white" className="ms-auto" href={'/stay-categories-map/' + category.handle}>
            <span className="me-1">Show map</span>
            <HugeiconsIcon icon={MapsLocation01Icon} size={20} color="currentColor" strokeWidth={1.5} />
          </Button>
        </div>
        <Divider className="my-8 md:mb-12" />
        {/* end heading */}

        <ListingFilterTabs filterOptions={filterOptions} />
        <HotelSearchResults />
      </div>
    </div>
  )
}

export default Page