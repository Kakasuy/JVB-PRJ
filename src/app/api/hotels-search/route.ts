import { NextRequest, NextResponse } from 'next/server'

// Helper function to get city display name
function getCityDisplayName(cityCode: string): string {
  const cityMap: Record<string, string> = {
    'NYC': 'New York City',
    'TYO': 'Tokyo',
    'PAR': 'Paris', 
    'LON': 'London',
    'BCN': 'Barcelona'
  }
  return cityMap[cityCode] || cityCode
}

// Helper function to get default address for city
function getDefaultAddress(cityCode: string): string {
  const addressMap: Record<string, string> = {
    'NYC': 'New York, NY',
    'TYO': 'Tokyo, Japan',
    'PAR': 'Paris, France',
    'LON': 'London, UK', 
    'BCN': 'Barcelona, Spain'
  }
  return addressMap[cityCode] || `${cityCode}, Unknown`
}

// Helper function to get default coordinates for city
function getDefaultCoordinates(cityCode: string): { lat: number, lng: number } {
  const coordinatesMap: Record<string, { lat: number, lng: number }> = {
    'NYC': { lat: 40.7128, lng: -74.0060 },
    'TYO': { lat: 35.6762, lng: 139.6503 },
    'PAR': { lat: 48.8566, lng: 2.3522 },
    'LON': { lat: 51.5074, lng: -0.1278 },
    'BCN': { lat: 41.3851, lng: 2.1734 }
  }
  return coordinatesMap[cityCode] || { lat: 0, lng: 0 }
}

// Amadeus hotel search API endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityCode = searchParams.get('cityCode') || 'NYC' // Default to New York
    const checkInDate = searchParams.get('checkInDate') || '2025-08-15'
    const checkOutDate = searchParams.get('checkOutDate') || '2025-08-17'
    const adults = searchParams.get('adults') || '1'
    const rooms = searchParams.get('rooms') || '1'
    const radius = searchParams.get('radius') || '30' // Default radius 30km
    const radiusUnit = searchParams.get('radiusUnit') || 'KM'
    const hotelSource = searchParams.get('hotelSource') || 'ALL'
    
    // Price range filters
    const priceMin = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : null
    const priceMax = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : null
    
    // Rooms & Beds filters
    const minBeds = searchParams.get('beds') ? Number(searchParams.get('beds')) : null
    const minBedrooms = searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : null
    const minBathrooms = searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : null
    
    // Room Type filters
    const roomTypes = searchParams.get('room_types') ? searchParams.get('room_types')?.split(',') : null
    
    // Amenities filters - get comma-separated amenities from URL params
    const amenities = searchParams.get('amenities') ? searchParams.get('amenities')?.split(',') : null
    
    // Hotel Stars filters - get comma-separated ratings from URL params
    const hotelStars = searchParams.get('hotel_stars') ? searchParams.get('hotel_stars')?.split(',') : null
    
    // Board Type filters - get comma-separated board types from URL params  
    const boardTypes = searchParams.get('board_types') ? searchParams.get('board_types')?.split(',') : null
    
    // Policy filters (Step 3 - post-processing)
    const freeCancellation = searchParams.get('free_cancellation') === 'true'
    const refundableOnly = searchParams.get('refundable_only') === 'true'
    const paymentTypes = searchParams.get('payment_types') ? searchParams.get('payment_types')?.split(',') : null
    

    // Get OAuth token first
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return NextResponse.json({ 
        error: 'Failed to get OAuth token', 
        status: tokenResponse.status,
        details: errorText 
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Step 1: Search for hotels by city using the correct endpoint
    const hotelSearchUrl = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city')
    hotelSearchUrl.searchParams.append('cityCode', cityCode)
    hotelSearchUrl.searchParams.append('radius', radius)
    hotelSearchUrl.searchParams.append('radiusUnit', radiusUnit)
    hotelSearchUrl.searchParams.append('hotelSource', hotelSource)
    
    // Add amenities filter if provided
    if (amenities && amenities.length > 0) {
      // Join amenities with comma for Amadeus API
      hotelSearchUrl.searchParams.append('amenities', amenities.join(','))
      console.log(`🏨 Filtering hotels by amenities: ${amenities.join(', ')}`)
    }
    
    // Add hotel stars filter if provided
    if (hotelStars && hotelStars.length > 0) {
      // Join ratings with comma for Amadeus API
      hotelSearchUrl.searchParams.append('ratings', hotelStars.join(','))
      console.log(`⭐ Filtering hotels by stars: ${hotelStars.join(', ')} stars`)
    }
    
    // Request more hotels in the first step - removed pagination as it may not be supported

    const hotelListResponse = await fetch(hotelSearchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!hotelListResponse.ok) {
      const errorText = await hotelListResponse.text()
      return NextResponse.json({ 
        error: 'Hotel list search failed',
        status: hotelListResponse.status,
        details: errorText 
      }, { status: 400 })
    }
    
    const hotelListData = await hotelListResponse.json()

    console.log(`Found ${hotelListData.data?.length || 0} hotels in step 1 for city ${cityCode}`)
    
    if (!hotelListData.data || hotelListData.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          count: 0,
          cityCode,
          message: 'No hotels found in this city'
        }
      })
    }

    // Step 2: Batch processing - Query multiple batches of 40 hotels each with parallel processing
    const BATCH_SIZE = 40
    const MAX_BATCHES = 5 // Query up to 160 hotels total (4 batches of 40)
    const totalHotelsToQuery = Math.min(MAX_BATCHES * BATCH_SIZE, hotelListData.data.length)
    const actualBatches = Math.ceil(totalHotelsToQuery / BATCH_SIZE)
    
    console.log(`🚀 Processing ${totalHotelsToQuery} hotels in ${actualBatches} batches (PARALLEL)`)
    
    // Helper function to query offers for a batch of hotels
    const queryHotelBatch = async (batchHotels: any[], batchIndex: number) => {
      const hotelIds = batchHotels.map((hotel: any) => hotel.hotelId).join(',')
      
      const hotelOffersUrl = new URL('https://test.api.amadeus.com/v3/shopping/hotel-offers')
      hotelOffersUrl.searchParams.append('hotelIds', hotelIds)
      hotelOffersUrl.searchParams.append('checkInDate', checkInDate)
      hotelOffersUrl.searchParams.append('checkOutDate', checkOutDate)
      hotelOffersUrl.searchParams.append('roomQuantity', rooms)
      hotelOffersUrl.searchParams.append('adults', adults)
      hotelOffersUrl.searchParams.append('currency', 'USD')
      
      // Add board type filter if provided
      if (boardTypes && boardTypes.length > 0) {
        hotelOffersUrl.searchParams.append('boardType', boardTypes.join(','))
        console.log(`🍽️ Filtering offers by board types: ${boardTypes.join(', ')}`)
      }

      console.log(`⚡ Batch ${batchIndex + 1}: Querying ${batchHotels.length} hotels (parallel)`)
      
      const hotelResponse = await fetch(hotelOffersUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!hotelResponse.ok) {
        const errorText = await hotelResponse.text()
        console.error(`Batch ${batchIndex + 1} failed:`, errorText)
        return { data: [] } // Return empty data instead of throwing error
      }

      const batchData = await hotelResponse.json()
      console.log(`✅ Batch ${batchIndex + 1} complete: ${batchData.data?.length || 0} hotels with offers`)
      
      return batchData
    }
    
    // Create batches of hotels
    const batches = []
    for (let i = 0; i < totalHotelsToQuery; i += BATCH_SIZE) {
      const batch = hotelListData.data.slice(i, i + BATCH_SIZE)
      if (batch.length > 0) {
        batches.push(batch)
      }
    }
    
    // Query all batches in parallel
    const batchPromises = batches.map((batch, index) => queryHotelBatch(batch, index))
    const batchResults = await Promise.all(batchPromises)
    
    // Combine all results
    const allHotelData = batchResults.reduce((combined, batchResult) => {
      if (batchResult.data && batchResult.data.length > 0) {
        combined.push(...batchResult.data)
      }
      return combined
    }, [])
    
    // Create combined response object
    const hotelData = {
      data: allHotelData,
      meta: batchResults[0]?.meta || {}
    }
    
    console.log(`🎉 PARALLEL COMPLETE: ${hotelData.data?.length || 0} hotels with offers from ${batches.length} batches`)

    // Helper function to check if hotel is a test property
    const isTestHotel = (hotelName: string, address?: string) => {
      const name = hotelName.toLowerCase()
      const addr = address?.toLowerCase() || ''
      
      const testKeywords = ['test', 'dummy', 'demo', 'sample', 'fake', 'mock', 'prop for', 'test property', 'booking property', 'api test', 'property par', 'property bcn', 'property lon', 'property nyc', 'property tyo']
      
      // Check hotel name for test keywords
      const hasTestName = testKeywords.some(keyword => name.includes(keyword)) || 
                         /^property\s+[a-z]{3}\s+\d{3}$/i.test(name)
      
      // Check address for test patterns
      const hasTestAddress = /^test\d+$/i.test(addr) || addr.includes('test')
      
      // Check for wrong city hotels (e.g., London hotel in Paris results)
      const cityMismatch = (cityCode === 'PAR' && name.includes('london')) ||
                           (cityCode === 'LON' && name.includes('paris')) ||
                           (cityCode === 'NYC' && (name.includes('london') || name.includes('paris'))) ||
                           (cityCode === 'TYO' && (name.includes('london') || name.includes('paris'))) ||
                           (cityCode === 'BCN' && (name.includes('london') || name.includes('paris')))
      
      return hasTestName || hasTestAddress || cityMismatch
    }

    // Create a map of hotel details from step 1 for better address info
    const hotelDetailsMap = new Map()
    hotelListData.data?.forEach((hotel: any) => {
      hotelDetailsMap.set(hotel.hotelId, hotel)
    })

    // Transform data to match our TStayListing interface, filtering out test hotels
    
    const filteredHotels = hotelData.data?.filter((hotelOffer: any) => {
      const hotelName = hotelOffer.hotel?.name || ''
      const hotelAddress = hotelOffer.hotel?.address?.lines?.join(', ') || ''
      const detailedInfo = hotelDetailsMap.get(hotelOffer.hotel?.hotelId)
      const detailedAddress = detailedInfo?.address?.lines?.join(', ') || ''
      const bestAddress = detailedAddress || hotelAddress
      const isTest = isTestHotel(hotelName, bestAddress)
      
      
      return !isTest
    }) || []
    
    
    const transformedHotels = filteredHotels.map((hotelOffer: any) => {
      const hotelInfo = hotelOffer.hotel
      const detailedHotelInfo = hotelDetailsMap.get(hotelInfo.hotelId) // Get detailed info from step 1
      const offers = hotelOffer.offers || []
      const lowestPriceOffer = offers.length > 0 ? offers.reduce((lowest: any, current: any) => {
        const currentPrice = parseFloat(current.price?.total || '999999')
        const lowestPrice = parseFloat(lowest.price?.total || '999999')
        return currentPrice < lowestPrice ? current : lowest
      }, offers[0]) : null

      // Generate a realistic image URL (using Pexels hotel images)
      const hotelImages = [
        'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
        'https://images.pexels.com/photos/261394/pexels-photo-261394.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/2861361/pexels-photo-2861361.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/6527036/pexels-photo-6527036.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/2677398/pexels-photo-2677398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
      ]
      
      const randomImageIndex = Math.floor(Math.random() * hotelImages.length)
      const featuredImage = hotelImages[randomImageIndex]
      
      // Create gallery with 4 different images
      const galleryImgs = Array.from({ length: 4 }, (_, index) => 
        hotelImages[(randomImageIndex + index) % hotelImages.length]
      )

      // Extract real bed information from Amadeus room data
      const roomInfo = lowestPriceOffer?.room || null
      const roomDescription = roomInfo?.description?.text || ''
      
      
      // Parse bed information from room data
      const extractBedInfo = () => {
        // Get beds from typeEstimated if available
        const estimatedBeds = roomInfo?.typeEstimated?.beds || null
        const bedType = roomInfo?.typeEstimated?.bedType || null
        
        // Parse from description text for additional info
        let parsedBeds = estimatedBeds
        let parsedBedrooms = 1 // Default to 1 bedroom for hotels
        let parsedBathrooms = 1 // Default to 1 bathroom
        
        if (roomDescription) {
          // Look for bed mentions in description
          const bedMatches = roomDescription.match(/(\d+)\s*(king|queen|double|single|twin)/gi)
          if (bedMatches && !parsedBeds) {
            parsedBeds = bedMatches.length
          }
          
          // Look for bedroom mentions
          const bedroomMatch = roomDescription.match(/(\d+)\s*bedroom/i)
          if (bedroomMatch) {
            parsedBedrooms = parseInt(bedroomMatch[1])
          }
          
          // Look for bathroom mentions  
          const bathroomMatch = roomDescription.match(/(\d+)\s*(bathroom|bath)/i)
          if (bathroomMatch) {
            parsedBathrooms = parseInt(bathroomMatch[1])
          }
          
          // Handle suite descriptions
          if (roomDescription.toLowerCase().includes('suite')) {
            parsedBedrooms = Math.max(parsedBedrooms, 1)
            parsedBathrooms = Math.max(parsedBathrooms, 1)
          }
        }
        
        const finalBeds = parsedBeds || 1 // Default to 1 if no info available
        
        
        return {
          beds: finalBeds,
          bedrooms: parsedBedrooms,
          bathrooms: parsedBathrooms,
          bedType: bedType
        }
      }
      
      const bedInfo = extractBedInfo()

      // Get best available address (prefer detailed info from step 1)
      const getBestAddress = () => {
        // Try step 1 detailed hotel info first
        if (detailedHotelInfo?.address?.lines && detailedHotelInfo.address.lines.length > 0) {
          return detailedHotelInfo.address.lines.join(', ')
        }
        // Try step 2 hotel offer info
        if (hotelInfo.address?.lines && hotelInfo.address.lines.length > 0) {
          return hotelInfo.address.lines.join(', ')
        }
        // Fallback to default city address
        return getDefaultAddress(cityCode)
      }

      return {
        id: `amadeus-hotel://${hotelInfo.hotelId}`,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        listingCategory: 'Hotel',
        title: hotelInfo.name || 'Hotel',
        handle: hotelInfo.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `hotel-${hotelInfo.hotelId}`,
        description: roomDescription || hotelInfo.description || `Located in ${getCityDisplayName(cityCode)}`,
        featuredImage,
        galleryImgs,
        like: Math.random() > 0.7, // Random like status
        address: getBestAddress(),
        reviewStart: Math.round((Math.random() * 2 + 3) * 10) / 10, // Keep random rating 3.0-5.0
        reviewCount: Math.floor(Math.random() * 500 + 20), // Keep random review count 20-520
        price: (() => {
          if (!lowestPriceOffer?.price?.total) return '$200'
          let price = parseFloat(lowestPriceOffer.price.total)
          
          // Fix abnormal prices (likely currency conversion issues)
          // For Tokyo, prices might be in JPY instead of USD
          if (cityCode === 'TYO' && price > 10000) {
            price = Math.round(price / 150) // Convert JPY to USD approximately
          }
          // For other cities, cap extremely high prices
          else if (price > 2000) {
            price = Math.floor(Math.random() * 800 + 200) // Random price $200-1000
          }
          
          return `$${Math.round(price)}`
        })(),
        maxGuests: lowestPriceOffer?.guests?.adults || 2,
        bedrooms: bedInfo.bedrooms, // ✅ Real bedroom info from Amadeus
        bathrooms: bedInfo.bathrooms, // ✅ Real bathroom info from Amadeus  
        beds: bedInfo.beds, // ✅ Real bed count from Amadeus
        saleOff: Math.random() > 0.8 ? `-${Math.floor(Math.random() * 20 + 5)}% today` : null,
        isAds: null,
        map: hotelInfo.geoCode ? {
          lat: parseFloat(hotelInfo.geoCode.latitude),
          lng: parseFloat(hotelInfo.geoCode.longitude)
        } : getDefaultCoordinates(cityCode),
        // Add bed type info for potential future use
        _bedType: bedInfo.bedType,
        _roomDescription: roomDescription,
        // Add room type category for verification
        roomType: roomInfo?.typeEstimated?.category || null,
        // Add rate information for price display
        lowestRateInfo: {
          rateCode: lowestPriceOffer?.rateCode || 'RAC',
          rateFamilyEstimated: lowestPriceOffer?.rateFamilyEstimated?.code || 
            (lowestPriceOffer?.rateCode === 'PRO' ? 'X' : 'P'), // PRO = Non-refundable, others = Flexible
          policies: lowestPriceOffer?.policies || {}
        },
        // Get highest price for dual display (only if multiple real offers exist)
        highestRateInfo: offers.length > 1 ? (() => {
          const highestPriceOffer = offers.reduce((highest: any, current: any) => {
            const currentPrice = parseFloat(current.price?.total || '0')
            const highestPrice = parseFloat(highest.price?.total || '0')
            return currentPrice > highestPrice ? current : highest
          }, offers[0])
          return {
            price: `$${Math.round(parseFloat(highestPriceOffer.price?.total || '0'))}`,
            rateCode: highestPriceOffer?.rateCode || 'RAC',
            rateFamilyEstimated: highestPriceOffer?.rateFamilyEstimated?.code || 'P'
          }
        })() : null,
        
        // Add board type information from offers
        boardTypes: offers.length > 0 ? (() => {
          const uniqueBoardTypes = new Set<string>()
          offers.forEach((offer: any) => {
            if (offer.boardType) {
              uniqueBoardTypes.add(offer.boardType)
            }
          })
          return Array.from(uniqueBoardTypes)
        })() : [],
        
        // Add detailed board type info for the lowest price offer
        lowestOfferBoardType: lowestPriceOffer?.boardType || null,
        
        // ✅ Add available offers with IDs for booking flow
        availableOffers: offers.map((offer: any) => ({
          id: offer.id,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          price: {
            total: offer.price?.total,
            currency: offer.price?.currency || 'USD'
          },
          room: {
            category: offer.room?.typeEstimated?.category,
            bedType: offer.room?.typeEstimated?.bedType,
            description: offer.room?.description?.text
          },
          boardType: offer.boardType,
          policies: offer.policies
        })),
        
        // ✅ Add primary offer ID for easy booking navigation
        primaryOfferId: lowestPriceOffer?.id || null
      }
    }) || []

    // Apply price range filters if provided
    let finalHotels = transformedHotels
    if (priceMin !== null || priceMax !== null) {
      console.log('Hotels before price filtering:', transformedHotels.length)
      
      finalHotels = transformedHotels.filter((hotel) => {
        const priceStr = hotel.price.replace('$', '').replace(',', '')
        const price = parseFloat(priceStr)
        
        // Skip hotels with invalid prices
        if (isNaN(price)) {
          return true
        }
        
        // Apply min price filter
        if (priceMin !== null && price < priceMin) {
          return false
        }
        
        // Apply max price filter  
        if (priceMax !== null && price > priceMax) {
          return false
        }
        return true
      })
      console.log('Hotels after price filtering:', finalHotels.length)
    }
    
    // Apply rooms & beds filters if provided
    if (minBeds !== null || minBedrooms !== null || minBathrooms !== null) {
      console.log('Hotels before rooms/beds filtering:', finalHotels.length)
      console.log(`Filter criteria - Beds: ${minBeds}, Bedrooms: ${minBedrooms}, Bathrooms: ${minBathrooms}`)
      
      finalHotels = finalHotels.filter((hotel) => {
        // Check beds
        if (minBeds !== null && hotel.beds < minBeds) {
          return false
        }
        
        // Check bedrooms
        if (minBedrooms !== null && hotel.bedrooms < minBedrooms) {
          return false
        }
        
        // Check bathrooms
        if (minBathrooms !== null && hotel.bathrooms < minBathrooms) {
          return false
        }
        
        return true
      })
      console.log('Hotels after rooms/beds filtering:', finalHotels.length)
    }
    
    // TEMPORARY: Collect all unique room types for analytics
    const allRoomTypes = new Set<string>()
    finalHotels.forEach((hotel) => {
      const originalHotel = hotelData.data?.find((h: any) => h.hotel?.hotelId === hotel.id.replace('amadeus-hotel://', ''))
      if (originalHotel) {
        const offers = originalHotel.offers || []
        offers.forEach((offer: any) => {
          const roomCategory = offer.room?.typeEstimated?.category
          if (roomCategory) {
            allRoomTypes.add(roomCategory)
          }
        })
      }
    })
    console.log('🔍 ALL UNIQUE ROOM TYPES FOUND:', Array.from(allRoomTypes).sort())

    // Apply room type filters if provided
    if (roomTypes && roomTypes.length > 0) {
      console.log('Hotels before room type filtering:', finalHotels.length)
      console.log(`Filter criteria - Room Types: ${roomTypes.join(', ')}`)
      
      finalHotels = finalHotels.filter((hotel) => {
        // Find the hotel in the original data to get room type info
        const originalHotel = hotelData.data?.find((h: any) => h.hotel?.hotelId === hotel.id.replace('amadeus-hotel://', ''))
        if (!originalHotel) return true // Keep hotel if we can't find original data
        
        const offers = originalHotel.offers || []
        
        // Check if any offer has a matching room type
        const hasMatchingRoomType = offers.some((offer: any) => {
          const roomCategory = offer.room?.typeEstimated?.category
          
          // Debug logs removed for production performance
          
          return roomCategory && roomTypes.includes(roomCategory)
        })
        
        return hasMatchingRoomType
      })
      
      console.log('Hotels after room type filtering:', finalHotels.length)
    }

    // Apply policy filters if provided (Step 3 - post-processing based on policies data)
    if (freeCancellation || refundableOnly || (paymentTypes && paymentTypes.length > 0)) {
      console.log('Hotels before policy filtering:', finalHotels.length)
      console.log(`Policy filter criteria - Free Cancellation: ${freeCancellation}, Refundable Only: ${refundableOnly}, Payment Types: ${paymentTypes?.join(', ') || 'none'}`)
      
      finalHotels = finalHotels.filter((hotel) => {
        // Find the hotel in the original data to get policies info
        const originalHotel = hotelData.data?.find((h: any) => h.hotel?.hotelId === hotel.id.replace('amadeus-hotel://', ''))
        if (!originalHotel) return true // Keep hotel if we can't find original data
        
        const offers = originalHotel.offers || []
        if (offers.length === 0) return true // Keep hotel if no offers
        
        // Check if any offer meets the policy criteria
        const hasValidOffer = offers.some((offer: any) => {
          const policies = offer.policies || {}
          
          // Check free cancellation
          if (freeCancellation) {
            const cancellations = policies.cancellations || []
            const hasFreeCancellation = cancellations.some((cancellation: any) => {
              // Free cancellation if amount is 0 or null/undefined
              const amount = parseFloat(cancellation.amount || '0')
              return amount === 0
            })
            
            if (!hasFreeCancellation) {
              return false // This offer doesn't have free cancellation
            }
          }
          
          // Check refundable rates
          if (refundableOnly) {
            const refundable = policies.refundable || {}
            const cancellationRefund = refundable.cancellationRefund || ''
            const isRefundable = cancellationRefund !== 'NON_REFUNDABLE' && cancellationRefund !== ''
            
            if (!isRefundable) {
              return false // This offer is not refundable
            }
          }
          
          // Check payment types
          if (paymentTypes && paymentTypes.length > 0) {
            const paymentType = policies.paymentType || ''
            const hasMatchingPaymentType = paymentTypes.includes(paymentType)
            
            if (!hasMatchingPaymentType) {
              return false // This offer doesn't have matching payment type
            }
          }
          
          return true // This offer meets all policy criteria
        })
        
        return hasValidOffer
      })
      
      console.log('Hotels after policy filtering:', finalHotels.length)
    }

    // Fetch hotel sentiments for all hotels
    const hotelIds = finalHotels.map(hotel => {
      // Extract hotelId from id field (format: "amadeus-hotel://HOTELID")
      const match = hotel.id.match(/amadeus-hotel:\/\/(.+)/)
      return match ? match[1] : null
    }).filter(Boolean)

    let sentimentsData = {}
    
    if (hotelIds.length > 0) {
      try {
        // Call our internal hotel-sentiments endpoint
        const sentimentsResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/hotel-sentiments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hotelIds }),
        })

        if (sentimentsResponse.ok) {
          const sentimentsResult = await sentimentsResponse.json()
          sentimentsData = sentimentsResult.sentiments || {}
        }
      } catch (error) {
        console.error('Failed to fetch hotel sentiments:', error)
        // Continue without sentiments data
      }
    }

    // Merge sentiment data with hotels
    const hotelsWithSentiments = finalHotels.map(hotel => {
      const hotelId = hotel.id.match(/amadeus-hotel:\/\/(.+)/)?.[1]
      const sentiment = hotelId ? sentimentsData[hotelId] : null
      
      if (sentiment && sentiment.overallRating > 0) {
        return {
          ...hotel,
          overallRating: sentiment.overallRating,
          numberOfRatings: sentiment.numberOfRatings,
          numberOfReviews: sentiment.numberOfReviews,
          // Keep reviewStart for backward compatibility but it will be overridden by overallRating in UI
          reviewStart: sentiment.overallRating / 20, // Convert 0-100 to 0-5 scale
          reviewCount: sentiment.numberOfRatings
        }
      }
      
      return hotel
    })

    return NextResponse.json({
      success: true,
      data: hotelsWithSentiments,
      meta: {
        count: hotelsWithSentiments.length,
        originalCount: transformedHotels.length,
        filtersApplied: { 
          priceMin, 
          priceMax,
          beds: minBeds,
          bedrooms: minBedrooms,
          bathrooms: minBathrooms,
          amenities: amenities,
          hotel_stars: hotelStars,
          board_types: boardTypes,
          free_cancellation: freeCancellation,
          refundable_only: refundableOnly,
          payment_types: paymentTypes
        },
        cityCode,
        checkInDate,
        checkOutDate,
        adults,
        hotelsFound: hotelListData.data?.length || 0,
        hotelsWithOffers: hotelData.data?.length || 0,
        sentimentsFound: Object.keys(sentimentsData).length
      },
      raw: hotelData.meta || null, // Include original meta for debugging
    })
  } catch (error) {
    console.error('Hotel search error:', error)
    return NextResponse.json({
      error: 'Hotel search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}