import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input parameter is required' },
        { status: 400 }
      )
    }

    // Use Geoapify API key
    const apiKey = 'dad5bb6f7a5345e0a2d7d4896ca535ec'
    
    // Use Geoapify Geocoding API
    const geocodingUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&apiKey=${apiKey}&limit=8&lang=en`
    
    const response = await fetch(geocodingUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Geoapify API failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to search places', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Convert Geoapify results to our format
    if (data.features && data.features.length > 0) {
      const results = data.features.map((feature: any) => ({
        place_id: feature.properties.place_id || `geoapify_${feature.properties.osm_id || Math.random()}`,
        display_name: feature.properties.formatted,
        formatted_address: feature.properties.formatted,
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
          }
        },
        address_components: [
          { long_name: feature.properties.housenumber || '', short_name: feature.properties.housenumber || '', types: ['street_number'] },
          { long_name: feature.properties.street || '', short_name: feature.properties.street || '', types: ['route'] },
          { long_name: feature.properties.city || feature.properties.town || feature.properties.village || '', short_name: feature.properties.city || feature.properties.town || feature.properties.village || '', types: ['locality'] },
          { long_name: feature.properties.state || feature.properties.county || '', short_name: feature.properties.state || feature.properties.county || '', types: ['administrative_area_level_1'] },
          { long_name: feature.properties.country || '', short_name: feature.properties.country_code?.toUpperCase() || '', types: ['country'] }
        ].filter(comp => comp.long_name), // Remove empty components
        name: feature.properties.name || feature.properties.street || feature.properties.formatted.split(',')[0]
      }))
      
      console.log(`✅ Found ${results.length} places for "${input}"`)
      
      return NextResponse.json({
        data: results,
        status: 'OK'
      })
    }
    
    return NextResponse.json({
      data: [],
      status: 'ZERO_RESULTS'
    })
    
  } catch (error) {
    console.error('Google Places API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}